/**
 * Footer – Application-wide footer.
 * Shows logos, project info (student project / University of West Attica),
 * quick links, and contact details.
 */

import React from 'react';
import { Github } from 'lucide-react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-section footer-brand">
                    <div className="footer-logos">
                        <img src="/logo.webp" alt="Absolute Cinema" className="footer-logo" />
                        <a
                            href="https://ice.uniwa.gr/en/home/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Visit UNIWA ICE website"
                        >
                            <img src="/padaLOGO.webp" alt="UNIWA ICE Logo" className="footer-logo" />
                        </a>
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
                        <li><a href="/movies">Movies</a></li>
                        <li><a href="/about">About Us</a></li>
                    </ul>
                </div>

                <div className="footer-section footer-contact">
                    <h3>Contact</h3>
                    <p>University of West Attica</p>
                    <p>Computer Science Department</p>
                    <a
                        className="footer-github"
                        href="https://github.com/jimpar1/Absolute-Cinemas"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open Absolute-Cinemas public repository on GitHub"
                    >
                        <Github size={18} aria-hidden="true" />
                        <span>GitHub Repository</span>
                    </a>
                    <p className="footer-year">© 2026 Absolute Cinema</p>
                </div>
            </div>
        </footer>
    );
}
