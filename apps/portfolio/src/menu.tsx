import './menu.css'
const Menu = () => {
    return (
        <div className="container">
            <a href={`${import.meta.env.BASE_URL}src/portfolio-game/game.html`} className="button"><span>Start</span></a>
            <a href={`${import.meta.env.BASE_URL}src/blog-website/blog.html`} className='button'><span>Blog</span></a>
            <a href={`${import.meta.env.BASE_URL}RVafadar_Resume.pdf`} className='button'><span>Resume</span></a>

        </div>
    );
};
export default Menu;
