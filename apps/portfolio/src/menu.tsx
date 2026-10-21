import './menu.css'
const Menu = () => {
    return (
        <div className="container">
            <a href={`${import.meta.env.BASE_URL}src/portfolio-game/game.html`} className="button"><span>Start</span></a>
            <a href={`${import.meta.env.BASE_URL}src/blog-website/blog.html`} className='button'><span>Blog</span></a>
            <a href={`${import.meta.env.BASE_URL}RVafadar_Resume.pdf`} className='button' target="_blank" rel="noopener noreferrer" aria-describedby="resume-navigation" title="Opens in a new tab"><span>Resume</span></a>
            <span id="resume-navigation" hidden>Opens in a new tab</span>

        </div>
    );
};
export default Menu;
