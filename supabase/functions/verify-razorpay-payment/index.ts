import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// HMAC-SHA256 signature verification helper
async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const payloadData = encoder.encode(`${orderId}|${paymentId}`);
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      payloadData
    );
    
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return generatedSignature === signature;
  } catch (err) {
    console.error('Signature calculation error:', err);
    return false;
  }
}

// Helper: Generate a cryptographically secure random license segment
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateLicenseSegment(length: number): string {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => chars[b % chars.length]).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { action, plan, email, paymentId, orderId, signature } = body

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Razorpay API keys are not configured on the server. Please check environment variables.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const razorpayAuthHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`)

    // --- ACTION: CREATE ORDER ---
    if (action === 'create_order') {
      if (!plan || !email) {
        return new Response(
          JSON.stringify({ error: 'Plan and email are required to create a payment order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let amount = 0;
      if (plan === 'lifetime') {
        amount = 599900; // ₹5,999 in paise
      } else if (plan === 'cloud') {
        amount = 1250000; // ₹12,500 in paise
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid plan chosen. Must be "lifetime" or "cloud"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': razorpayAuthHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: `rec_${Math.random().toString(36).substring(2, 11)}`,
          notes: {
            plan,
            email: email.trim()
          }
        })
      })

      if (!orderResponse.ok) {
        const errText = await orderResponse.text()
        console.error('Razorpay Create Order API error:', errText)
        return new Response(
          JSON.stringify({ error: `Razorpay Order creation failed: ${errText}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const rzpOrder = await orderResponse.json()

      return new Response(
        JSON.stringify({ 
          success: true, 
          order: rzpOrder,
          keyId: keyId // return public key so client can load it dynamically
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- ACTION: VERIFY PAYMENT & GENERATE LICENSE ---
    if (action === 'verify_payment') {
      if (!paymentId || !orderId || !signature || !plan || !email) {
        return new Response(
          JSON.stringify({ verified: false, error: 'paymentId, orderId, signature, plan, and email are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 1. Verify the cryptographic signature
      const isSignatureValid = await verifySignature(orderId, paymentId, signature, keySecret)
      if (!isSignatureValid) {
        return new Response(
          JSON.stringify({ verified: false, error: 'Razorpay signature verification failed. Untrusted request.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 2. Double Spend Check (check if this paymentId was already used)
      const { data: existingLicense, error: checkError } = await supabaseAdmin
        .from('licenses')
        .select('id')
        .eq('payment_id', paymentId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing payment registration:', checkError)
      }

      if (existingLicense) {
        return new Response(
          JSON.stringify({ verified: false, error: 'This payment transaction has already registered a license key.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 3. Fetch payment details from Razorpay to verify capturing & amount
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': razorpayAuthHeader }
      })

      if (!response.ok) {
        const errText = await response.text()
        return new Response(
          JSON.stringify({ verified: false, error: `Razorpay payment query failed: ${errText}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const payment = await response.json()
      
      // Enforce status
      const isSuccessful = payment.status === 'captured' || payment.status === 'authorized'
      if (!isSuccessful) {
        return new Response(
          JSON.stringify({ verified: false, error: `Razorpay payment status is ${payment.status}, not authorized/captured` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Enforce correct amount matches the plan
      let expectedAmount = plan === 'lifetime' ? 599900 : 1250000
      if (payment.amount !== expectedAmount) {
        return new Response(
          JSON.stringify({ 
            verified: false, 
            error: `Payment amount mismatch. Plan expects ${expectedAmount/100} INR, but transaction was for ${payment.amount/100} INR.` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 4. Generate license key
      const prefix = plan === 'cloud' ? 'POS-CLOUD' : 'POS-LIFETIME'
      const newKey = `${prefix}-${generateLicenseSegment(4)}-${generateLicenseSegment(4)}`

      // 5. Insert license key record into public.licenses (bypassing RLS with admin client)
      const { data: insertedLicense, error: insertError } = await supabaseAdmin
        .from('licenses')
        .insert({
          license_key: newKey,
          user_email: email.trim(),
          validity: plan,
          hwid: null,
          expires_at: null,
          is_active: true,
          payment_id: paymentId,
          order_id: orderId
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting verified license key:', insertError)
        return new Response(
          JSON.stringify({ verified: false, error: `Failed to save license record: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          verified: true, 
          license_key: newKey,
          paymentId: paymentId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fallback error
    return new Response(
      JSON.stringify({ error: `Unknown action: "${action}". Valid actions are: create_order, verify_payment` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Edge Function runtime exception:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
