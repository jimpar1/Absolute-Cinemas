/*
Αυτό το στοιχείο εμφανίζει τη γραμμή πλοήγησης με το λογότυπο και τους συνδέσμους προς τις κύριες σελίδες.
*/

import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav style={styles.nav}>
            <Link to="/" style={styles.logoLink}>
                <img src="/logo.webp" alt="Absolute Cinema" style={styles.logoImg} />
            </Link>
            <div style={styles.links}>
                <Link to="/">Home</Link>
                <Link to="/movies">Movies</Link>
                <Link to="/screenings">Screenings</Link>
                <Link to="/halls">Halls</Link>
            </div>
        </nav>
    );
}

const styles = {
    nav: {
        padding: "0.75rem 2rem",
        background: "#151515",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    logoLink: {
        display: "flex",
        alignItems: "center",
        textDecoration: "none",
        position: "absolute",
        left: "2rem",
    },
    logoImg: {
        height: "40px",
        width: "auto",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
        transition: "transform 0.2s ease",
    },
    links: {
        display: "flex",
        gap: "1.5rem",
        fontSize: "1.2rem",
        alignItems: "center",
    },
};
