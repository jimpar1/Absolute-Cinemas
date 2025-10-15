/*
Αυτή η σελίδα εμφανίζει τις αίθουσες κινηματογράφου με τις πληροφορίες τους.
*/

import { useEffect, useState } from "react";
import { getMovieHalls } from "../api/moviehalls";

export default function MovieHalls() {
    const [halls, setHalls] = useState([]);

    useEffect(() => {
        getMovieHalls().then(data => {
            console.log("Movie halls data:", data);
            if(data.results) {
                setHalls(data.results)
            } else {
                setHalls(data);
            }
        });
    }, []);

    return (
        <>
            <div>
                <h2>Movie Halls</h2>
                <ul>
                    {halls.map(hall => (
                        <li key={hall.id}>
                            {hall.name} - Capacity: {hall.capacity}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}
