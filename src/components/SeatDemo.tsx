import { useState } from 'react';
import { Armchair, Layers, Moon, Sun, Monitor } from 'lucide-react';

interface Seat {
  id: number;
  label: string;
  status: 'available' | 'morning' | 'evening' | 'night' | 'full';
  memberName?: string;
}

export default function SeatDemo() {
  const initialSeats: Seat[] = [
    { id: 1, label: 'A1', status: 'full', memberName: 'Rohan Sharma' },
    { id: 2, label: 'A2', status: 'available' },
    { id: 3, label: 'A3', status: 'morning', memberName: 'Priya Verma' },
    { id: 4, label: 'A4', status: 'evening', memberName: 'Amit Patel' },
    { id: 5, label: 'A5', status: 'available' },
    { id: 6, label: 'A6', status: 'night', memberName: 'Sneha Rao' },
    { id: 7, label: 'B1', status: 'morning', memberName: 'Karan Malhotra' },
    { id: 8, label: 'B2', status: 'evening', memberName: 'Vikram Joshi' },
    { id: 9, label: 'B3', status: 'available' },
    { id: 10, label: 'B4', status: 'full', memberName: 'Ananya Sen' },
    { id: 11, label: 'B5', status: 'night', memberName: 'Rahul Singh' },
    { id: 12, label: 'B6', status: 'available' },
    { id: 13, label: 'C1', status: 'available' },
    { id: 14, label: 'C2', status: 'morning', memberName: 'Neha Gupta' },
    { id: 15, label: 'C3', status: 'full', memberName: 'Abhishek Dey' },
    { id: 16, label: 'C4', status: 'available' },
    { id: 17, label: 'C5', status: 'evening', memberName: 'Aditya Raj' },
    { id: 18, label: 'C6', status: 'available' },
  ];

  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(initialSeats[2]); // Default selection

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
  };

  const changeShift = (newStatus: 'available' | 'morning' | 'evening' | 'night' | 'full', memberName?: string) => {
    if (!selectedSeat) return;

    const updatedSeats = seats.map(s => {
      if (s.id === selectedSeat.id) {
        const updated = {
          ...s,
          status: newStatus,
          memberName: newStatus === 'available' ? undefined : (memberName || s.memberName || 'Guest User')
        };
        setSelectedSeat(updated);
        return updated;
      }
      return s;
    });

    setSeats(updatedSeats);
  };

  // Stats calculation
  const total = seats.length;
  const available = seats.filter(s => s.status === 'available').length;
  const morning = seats.filter(s => s.status === 'morning').length;
  const evening = seats.filter(s => s.status === 'evening').length;
  const night = seats.filter(s => s.status === 'night').length;
  const full = seats.filter(s => s.status === 'full').length;
  const occupied = total - available;

  const getShiftIcon = (status: Seat['status']) => {
    switch (status) {
      case 'morning': return <Sun size={14} style={{ color: '#f59e0b' }} />;
      case 'evening': return <Monitor size={14} style={{ color: '#3b82f6' }} />;
      case 'night': return <Moon size={14} style={{ color: '#10b981' }} />;
      case 'full': return <Layers size={14} style={{ color: '#8b5cf6' }} />;
      default: return null;
    }
  };

  return (
    <section id="seat-demo" className="demo-section">
      <div className="container">
        <div className="section-header">
          <div className="badge mb-4">Live Interactive Simulator</div>
          <h2>Study Desk Shift Manager</h2>
          <p>
            Experience how Pustak OS manages seats in reading halls. Assign desks to students based on specific shift slots or reserve them for full-day premium members. Click on any seat below to test it.
          </p>
        </div>

        <div className="demo-container">
          {/* Seat Grid Box */}
          <div className="demo-visual-card">
            <div className="demo-dashboard-header">
              <div className="desk-matrix-title">
                <Armchair size={20} className="gradient-text" /> Hall A Desk Layout
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: 600 }}>
                Interactive Matrix Grid
              </div>
            </div>

            {/* Legend */}
            <div className="matrix-legend">
              <div className="legend-item">
                <div className="legend-color legend-available"></div>
                <span>Free ({available})</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-morning"></div>
                <span>Morning ({morning})</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-evening"></div>
                <span>Evening ({evening})</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-night"></div>
                <span>Night ({night})</span>
              </div>
              <div className="legend-item">
                <div className="legend-color legend-full"></div>
                <span>Full Day ({full})</span>
              </div>
            </div>

            {/* Seat Grid */}
            <div className="seat-grid">
              {seats.map(seat => (
                <button
                  key={seat.id}
                  className={`seat-box ${seat.status} ${selectedSeat?.id === seat.id ? 'selected' : ''}`}
                  onClick={() => handleSeatClick(seat)}
                  style={selectedSeat?.id === seat.id ? { borderColor: '#8b5cf6', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)', transform: 'scale(1.05)' } : {}}
                >
                  <span className="seat-number">{seat.label}</span>
                  {seat.status !== 'available' && (
                    <span className="seat-shift-label">
                      {seat.status}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Seat Quick Info */}
            {selectedSeat && (
              <div className="seat-detail-card">
                <div className="seat-detail-left">
                  <div className={`success-icon-ring`} style={{ width: '40px', height: '40px', margin: 0, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Armchair size={18} style={{ color: selectedSeat.status === 'available' ? '#9ca3af' : '#a78bfa' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>Desk {selectedSeat.label}</h4>
                    <p style={{ fontSize: '0.75rem' }}>
                      {selectedSeat.status === 'available' 
                        ? 'Unassigned Seat' 
                        : `Assigned: ${selectedSeat.memberName}`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {getShiftIcon(selectedSeat.status)}
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    {selectedSeat.status === 'available' ? 'Available' : `${selectedSeat.status} Shift`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Control Panel */}
          <div className="glass-card text-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
              Simulator Controller
            </h3>
            
            {selectedSeat ? (
              <>
                <p>
                  You are editing <strong>Seat {selectedSeat.label}</strong>. Change its subscription state to preview how the database updates and renders state instantly on the UI:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student / Occupant Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={selectedSeat.memberName || ''}
                    placeholder="Enter student name..."
                    disabled={selectedSeat.status === 'available'}
                    onChange={(e) => changeShift(selectedSeat.status, e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Shift Subscription</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button 
                      className={`btn ${selectedSeat.status === 'available' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => changeShift('available')}
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      Available
                    </button>
                    <button 
                      className={`btn ${selectedSeat.status === 'morning' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => changeShift('morning', selectedSeat.memberName || 'Ramesh Kumar')}
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      Morning Slot
                    </button>
                    <button 
                      className={`btn ${selectedSeat.status === 'evening' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => changeShift('evening', selectedSeat.memberName || 'Sunita Devi')}
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      Evening Slot
                    </button>
                    <button 
                      className={`btn ${selectedSeat.status === 'night' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => changeShift('night', selectedSeat.memberName || 'Amit Sengupta')}
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      Night Slot
                    </button>
                    <button 
                      className={`btn ${selectedSeat.status === 'full' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => changeShift('full', selectedSeat.memberName || 'Rajiv Malhotra')}
                      style={{ fontSize: '0.85rem', padding: '0.5rem', gridColumn: 'span 2' }}
                    >
                      Full Day License
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                Select a seat in the grid matrix to change its details.
              </p>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div>Total Capacity: <strong>{total}</strong></div>
              <div>Occupied: <strong style={{ color: '#a78bfa' }}>{occupied} ({Math.round((occupied/total)*100)}%)</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
