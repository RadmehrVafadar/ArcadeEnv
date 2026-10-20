import './menu.css'
const Menu = () => {
    return (
        <div className="container">
            <a href={`${import.meta.env.BASE_URL}src/portfolio-game/game.html`} className="button">Start</a>
            <a href={`${import.meta.env.BASE_URL}src/blog-website/blog.html`} target="_blank" rel="noopener noreferrer" className='button'>Blog</a>
            <a href={`${import.meta.env.BASE_URL}RVafadar_Resume.pdf`} target="_blank" rel="noopener noreferrer" className='button'>Resume</a>

        </div>
    );
};
export default Menu;
