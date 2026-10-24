import './menu.css'
import { useEffect, useRef } from 'react'
import { installCabinetNavigation } from './cabinet-navigation'
const Menu = () => {
    const container = useRef<HTMLDivElement>(null)
    const mobile = window.matchMedia('(pointer: coarse)').matches
    const resumeNavigation = mobile ? 'Opens PDF in the current browser' : 'Opens in a new tab'
    useEffect(() => installCabinetNavigation(container.current!, import.meta.env.BASE_URL), [])
    return (
        <div className="container" ref={container}>
            <a href={`${import.meta.env.BASE_URL}src/portfolio-game/game.html`} className="button"><span>Start</span></a>
            <a href={`${import.meta.env.BASE_URL}src/blog-website/blog.html`} className='button'><span>Blog</span></a>
            <a href={`${import.meta.env.BASE_URL}RVafadar_Resume.pdf`} className='button' target={mobile ? '_top' : '_blank'} rel="noopener noreferrer" aria-describedby="resume-navigation" title={resumeNavigation}><span>Resume</span></a>
            <span id="resume-navigation" hidden>{resumeNavigation}</span>

        </div>
    );
};
export default Menu;
