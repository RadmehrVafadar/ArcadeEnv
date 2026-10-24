import './menu.css'
import { useEffect, useRef } from 'react'
import { installCabinetNavigation } from './cabinet-navigation'
const Menu = () => {
    const container = useRef<HTMLDivElement>(null)
    useEffect(() => installCabinetNavigation(container.current!, import.meta.env.BASE_URL), [])
    return (
        <div className="container" ref={container}>
            <a href={`${import.meta.env.BASE_URL}src/portfolio-game/game.html`} className="button"><span>Start</span></a>
            <a href={`${import.meta.env.BASE_URL}src/blog-website/blog.html`} className='button'><span>Blog</span></a>
            <a href={`${import.meta.env.BASE_URL}RVafadar_Resume.pdf`} className='button' target="_blank" rel="noopener noreferrer" aria-describedby="resume-navigation" title="Opens in a new tab"><span>Resume</span></a>
            <span id="resume-navigation" hidden>Opens in a new tab</span>

        </div>
    );
};
export default Menu;
