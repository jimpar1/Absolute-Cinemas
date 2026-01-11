/*
Αυτή η σελίδα εμφανίζει πληροφορίες σχετικά με το Absolute Cinema.
*/

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Users, Star, Heart, MapPin, Mail, Phone } from "lucide-react"

export default function AboutUs() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">About Us</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Welcome to Absolute Cinema - your ultimate destination for the best movie experience.
                </p>
            </div>

            {/* Our Story */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Film className="h-6 w-6" />
                        Our Story
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                        Absolute Cinema was founded with a simple mission: to bring the magic of movies to everyone.
                        We believe that cinema is more than just entertainment - it's an experience that brings people together,
                        sparks imagination, and creates lasting memories. Our state-of-the-art facilities combined with
                        a passion for film make us the perfect destination for movie lovers of all ages.
                    </p>
                </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Premium Experience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            Enjoy movies in crystal-clear quality with our cutting-edge projection
                            and immersive Dolby Atmos sound systems.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-blue-500" />
                            Community First
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            We're more than a cinema - we're a community of film enthusiasts who
                            share a love for storytelling and cinematic art.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Heart className="h-5 w-5 text-red-500" />
                            Passion for Film
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            Our team consists of dedicated movie lovers who curate the best
                            selection of films from blockbusters to indie gems.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-6 w-6" />
                        Contact Us
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <h4 className="font-medium mb-1">Address</h4>
                                <p className="text-sm text-muted-foreground">
                                    123 Cinema Street<br />
                                    Movie City, MC 12345
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <h4 className="font-medium mb-1">Phone</h4>
                                <p className="text-sm text-muted-foreground">
                                    +1 (555) 123-4567
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <h4 className="font-medium mb-1">Email</h4>
                                <p className="text-sm text-muted-foreground">
                                    info@absolutecinema.com
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground italic">
                    Note: This is a demo website. All movies, screenings, and booking features are for demonstration purposes only.
                </p>
            </div>
        </div>
    )
}

