/**
 * SeatSelection – Step 1 of the booking flow.
 * Renders a 3D perspective cinema seating grid where users can
 * select / deselect seats. Shows a summary bar with selected seats and total price.
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Renders one section (left / middle / right) of seats for a single row.
 * Each seat is a small button coloured by its state (available / selected / occupied).
 */
function SeatSection({ sectionKey, section, row, rowIndex, hallLayout, selectedSeats, onToggleSeat }) {
    if (!section.enabled) return null
    return (
        <div key={sectionKey} className="flex gap-1 sm:gap-1.5">
            {Array.from({ length: section.seatsPerRow }, (_, i) => {
                const seatIndexInTier = (rowIndex * section.seatsPerRow) + i;
                if (section.maxSeats && seatIndexInTier >= section.maxSeats) {
                    return <div key={`empty-${row}-${i}`} className="w-6 h-6 sm:w-8 sm:h-8" />;
                }
                const seatNumber = section.startSeat + i
                const seat = `${row}${seatNumber}`
                const isOccupied = hallLayout.occupiedSeats.includes(seat)
                const isSelected = selectedSeats.includes(seat)
                return (
                    <button
                        key={seat}
                        onClick={() => onToggleSeat(seat)}
                        disabled={isOccupied}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-t-lg text-xs font-medium transition-all duration-200 ${isOccupied ? 'bg-linear-to-b from-red-400 to-red-600 text-red-100 cursor-not-allowed' :
                            isSelected ? 'bg-linear-to-b from-green-400 to-green-600 text-white hover:scale-110' :
                                'bg-linear-to-b from-white to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:scale-110'
                            }`}
                    >
                        {seatNumber}
                    </button>
                )
            })}
        </div>
    )
}

export default function SeatSelection({ hallLayout, selectedSeats, totalPrice, onToggleSeat, onConfirm }) {
    if (!hallLayout) return null

    return (
        <Card className="overflow-visible border-none shadow-none bg-transparent">
            <CardContent className="overflow-visible">
                <div className="relative" style={{ perspective: '1000px', perspectiveOrigin: '50% 20%' }}>
                    {/* The Screen */}
                    <div className="mb-12 flex flex-col items-center">
                        <img src="/screen.webp" alt="Screen" className="w-[45%] max-w-md h-auto" style={{ transform: 'rotateX(10deg)', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))' }} />
                        <p className="text-[10px] tracking-[0.3em] text-muted-foreground mt-4 uppercase">Cinema Screen</p>
                    </div>

                    {/* The 3D Curved Seat Grid */}
                    <div className="w-full overflow-x-auto pb-10 flex flex-col items-center">
                        {(hallLayout.tiers ? hallLayout.tiers : [{ name: 'Main', rows: hallLayout.rows || [], sections: hallLayout.sections }]).map((tier) => (
                            <div key={tier.name} className="flex flex-col items-center gap-2 min-w-max mb-6" style={{ transform: 'rotateX(25deg)', transformStyle: 'preserve-3d' }}>
                                {tier.name !== 'Main' && (
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-4 mt-8">— {tier.name} —</div>
                                )}
                                {tier.rows && tier.rows.map((row, rowIndex) => {
                                    const middleIndex = (tier.rows.length - 1) / 2
                                    const curve = Math.pow(Math.abs(rowIndex - middleIndex), 1.8) * 8
                                    const scale = 0.85 + (rowIndex / tier.rows.length) * 0.15
                                    return (
                                        <div key={row} className="flex items-center gap-3" style={{ paddingLeft: `${curve}px`, paddingRight: `${curve}px`, transform: `scale(${scale}) translateZ(${rowIndex * 5}px)` }}>
                                            <span className="w-6 text-[10px] font-bold text-muted-foreground text-right">{row}</span>
                                            <SeatSection sectionKey="left" section={tier.sections.left} row={row} rowIndex={rowIndex} hallLayout={hallLayout} selectedSeats={selectedSeats} onToggleSeat={onToggleSeat} />
                                            <div className="w-4" />
                                            <SeatSection sectionKey="middle" section={tier.sections.middle} row={row} rowIndex={rowIndex} hallLayout={hallLayout} selectedSeats={selectedSeats} onToggleSeat={onToggleSeat} />
                                            <div className="w-4" />
                                            <SeatSection sectionKey="right" section={tier.sections.right} row={row} rowIndex={rowIndex} hallLayout={hallLayout} selectedSeats={selectedSeats} onToggleSeat={onToggleSeat} />
                                            <span className="w-6 text-[10px] font-bold text-muted-foreground">{row}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-card border rounded-xl mt-6 gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-muted-foreground">Seats Selected</p>
                        <p className="text-lg font-bold">{selectedSeats.length > 0 ? selectedSeats.sort().join(', ') : 'Select seats...'}</p>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground">Total Price</p>
                        <p className="text-2xl font-black text-primary">${totalPrice}</p>
                    </div>
                </div>
                <Button className="w-full h-12 mt-6 text-lg font-bold" disabled={selectedSeats.length === 0} onClick={onConfirm}>Confirm Seats</Button>
            </CardContent>
        </Card>
    )
}
