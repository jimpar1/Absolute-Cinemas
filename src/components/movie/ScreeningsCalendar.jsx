/**
 * ScreeningsCalendar – Weekly / monthly calendar view that shows which days have screenings.
 * Clicking a day with screenings opens the ScreeningsModal.
 * Also handles the "upcoming" and "no screenings" empty states.
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react"
import { getWeekDays, getMonthDays, getScreeningsForDate, isToday } from "@/utils/calendar"
import ScreeningsModal from "./ScreeningsModal"

export default function ScreeningsCalendar({ movie, screenings }) {
    const [calendarView, setCalendarView] = useState('weekly')
    const [selectedDate, setSelectedDate] = useState(null)

    /* The Monday that starts the currently viewed week */
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(today.setDate(diff))
    })

    const [currentMonth, setCurrentMonth] = useState(new Date())

    /** Shift the weekly view forward or backward by one week. */
    const navigateWeek = (direction) => {
        const newDate = new Date(currentWeekStart)
        newDate.setDate(currentWeekStart.getDate() + (direction * 7))
        setCurrentWeekStart(newDate)
    }

    /** Shift the monthly view forward or backward by one month. */
    const navigateMonth = (direction) => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(currentMonth.getMonth() + direction)
        setCurrentMonth(newDate)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Screenings</h2>
                {screenings.length > 0 && movie.status !== 'upcoming' && (
                    <div className="flex gap-2">
                        <Button
                            variant={calendarView === 'weekly' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCalendarView('weekly')}
                            className="gap-2"
                        >
                            <CalendarDays className="h-4 w-4" />
                            Weekly
                        </Button>
                        <Button
                            variant={calendarView === 'monthly' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCalendarView('monthly')}
                            className="gap-2"
                        >
                            <CalendarRange className="h-4 w-4" />
                            Monthly
                        </Button>
                    </div>
                )}
            </div>

            {/* Upcoming notice */}
            {movie.status === 'upcoming' ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">This movie is upcoming. Get notified when tickets are available.</p>
                        <Button variant="outline">Notify Me</Button>
                    </CardContent>
                </Card>

                /* No screenings */
            ) : screenings.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No screenings available at this time.</p>
                    </CardContent>
                </Card>

                /* Weekly view */
            ) : calendarView === 'weekly' ? (
                <Card>
                    <CardContent className="p-4">
                        {/* Week Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-medium">
                                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {
                                    (() => {
                                        const endDate = new Date(currentWeekStart);
                                        endDate.setDate(currentWeekStart.getDate() + 6);
                                        return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    })()
                                }
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Week Days Grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                            {getWeekDays(currentWeekStart).map((date, index) => {
                                const dayScreenings = getScreeningsForDate(screenings, date);
                                const hasScreenings = dayScreenings.length > 0;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => hasScreenings && setSelectedDate(date)}
                                        className={`min-h-[80px] p-2 rounded-lg border transition-all ${hasScreenings ? 'cursor-pointer' : ''
                                            } ${isToday(date)
                                                ? 'border-primary bg-primary/10'
                                                : hasScreenings
                                                    ? 'border-border bg-card hover:bg-accent hover:scale-[1.02]'
                                                    : 'border-border/50 bg-muted/30'
                                            }`}
                                    >
                                        <div className={`text-sm font-medium mb-1 ${isToday(date) ? 'text-primary' : ''}`}>
                                            {date.getDate()}
                                        </div>
                                        {hasScreenings && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                                <span className="text-xs text-muted-foreground">
                                                    {dayScreenings.length} show{dayScreenings.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                /* Monthly view */
            ) : (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-medium">
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                            {getMonthDays(currentMonth).map((date, index) => {
                                if (!date) return <div key={index} className="min-h-[60px]" />;
                                const dayScreenings = getScreeningsForDate(screenings, date);
                                const hasScreenings = dayScreenings.length > 0;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => hasScreenings && setSelectedDate(date)}
                                        className={`min-h-[60px] p-1 rounded-lg border transition-all ${hasScreenings ? 'cursor-pointer' : ''
                                            } ${isToday(date)
                                                ? 'border-primary bg-primary/10'
                                                : hasScreenings
                                                    ? 'border-border bg-card hover:bg-accent hover:scale-[1.02]'
                                                    : 'border-border/50 bg-muted/30'
                                            }`}
                                    >
                                        <div className={`text-xs font-medium mb-1 ${isToday(date) ? 'text-primary' : ''}`}>
                                            {date.getDate()}
                                        </div>
                                        {hasScreenings && (
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                <span className="text-[10px] text-muted-foreground">
                                                    {dayScreenings.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Screenings modal for a specific date */}
            <ScreeningsModal
                selectedDate={selectedDate}
                screenings={screenings}
                onClose={() => setSelectedDate(null)}
            />
        </div>
    )
}
