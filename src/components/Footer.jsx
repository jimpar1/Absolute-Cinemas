/*
Αυτό το στοιχείο εμφανίζει το υποσέλιδο της εφαρμογής με λογότυπα, πληροφορίες, συνδέσμους και στοιχεία επικοινωνίας.
*/

import React from 'react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-section footer-brand">
                    <div className="footer-logos">
                        <img src="/logo.webp" alt="Absolute Cinema" className="footer-logo" />
                        <img src="/padaLOGO.webp" alt="Pada Logo" className="footer-logo" />
                    </div>
                    <p className="footer-tagline">Your Ultimate/Fake Movie Experience</p>
                </div>

                <div className="footer-section footer-info">
                    <h3>About This Project</h3>
                    <p className="footer-disclaimer">
                        <strong>Student Project</strong>
                    </p>
                    <p>
                        Developed at the <strong>University of West Attica</strong> for educational purposes only.
                        Not intended for commercial use.
                    </p>
                    <p className="footer-copyright">
                        All content used for academic demonstration purposes only.
                    </p>
                </div>

                <div className="footer-section footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/screenings">Screenings</a></li>
                        <li><a href="/halls">Halls</a></li>
                    </ul>
                </div>

                <div className="footer-section footer-contact">
                    <h3>Contact</h3>
                    <p>University of West Attica</p>
                    <p>Computer Science Department</p>
                    <p className="footer-year">© 2025 Absolute Cinema</p>
                </div>
            </div>
        </footer>
    );
}
