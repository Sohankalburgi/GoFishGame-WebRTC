import { Link } from "react-router";
import homePageImage from "../../public/Designer.png";
const Home = () => {
  return (
    <div
      className="text-black p-10 mt-10 mb-28 mx-10 rounded-lg"
      style={{
        background: "linear-gradient(135deg, #2F2C59, #F0209B)",
      }}
    >
      <h1 className="text-4xl text-white font-bold text-center">
        Welcome to Go Fish Game
      </h1>
      <div className="flex ">
        <img
          src={homePageImage}
          alt="Go Fish Game"
          width={500}
          className="  rounded-full  "
        />
         <div>
        <p className="text-white text-xl mt-10">
          Go Fish is a card game that is played with a standard 52-card deck of
          playing cards. It is a fun game that is easy to learn.</p>
      </div>

      <div className="relative top-60 right-96">
        <button className="text-2xl text-white bg-orange-600 p-3 hover:scale-105 transition-all ease-in-out rounded-lg">
            <Link to={'/login'}><div className="text-nowrap px-5">Get Started</div></Link>
        </button>
      </div>
      </div>
     
    </div>
  );
};

export default Home;
