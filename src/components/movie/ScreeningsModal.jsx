/**
 * ScreeningsModal – Dialog that lists all screenings for a selected date.
 * Each screening shows its time, hall name, and a "Book Now" link.
 */

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, ChevronRight } from "lucide-react"
import { getScreeningsForDate } from "@/utils/calendar"

export default function ScreeningsModal({ selectedDate, screenings, onClose }) {
    return (
        <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Screenings for {selectedDate?.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                    {selectedDate && getScreeningsForDate(screenings, selectedDate).map(screening => (
                        <Card key={screening.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-lg">
                                            {new Date(screening.start_time).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        {screening.hall_name && (
                                            <p className="text-sm text-muted-foreground">
                                                {screening.hall_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Link to={`/booking/${screening.id}`}>
                                    <Button size="sm" className="gap-2">
                                        Book Now
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
