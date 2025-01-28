
import { NavLink } from "react-router";
import { useAuth } from "../contextProvider/authProvider";

const Navbar = () => {
  const { isAuthenticated, logout ,} = useAuth();
  return (
    <div id="webcrumbs">
      <div className="w-full bg-white/70 rounded-lg shadow-lg backdrop-blur-md">
        <nav className="flex justify-between items-center  px-6 bg-white/70 rounded-lg shadow-sm backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl  font-title  font-semibold text-red-800">
                  GoFish
                </span>
              </div>
            </div>
          </div>
          <ul className="flex gap-8 text-neutral-950 font-medium"></ul>
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <NavLink to={"/login"}>
                  <button className="text-red-950 px-4 py-2 rounded-md hover:text-red-500 hover:scale-110 transition-transform duration-300 ease-in-out">
                    Login
                  </button>
                </NavLink>
                <NavLink to={"/signup"}>
                  <button className="text-red-950 px-4 py-2 rounded-md hover:text-red-500 hover:scale-110 transition-transform duration-300 ease-in-out">
                    Signup
                  </button>
                </NavLink>
              </>
            ) : (
              <>
              <NavLink to={`/startGame`}>
                <button className="text-red-950 px-4 py-2 rounded-md hover:text-red-500 hover:scale-110 transition-transform duration-300 ease-in-out">
                  Create Room
                </button>
              </NavLink>
              <NavLink to={`/joingame/${localStorage.getItem('authToken')}`}>
                <button className="text-red-950 px-4 py-2 rounded-md hover:text-red-500 hover:scale-110 transition-transform duration-300 ease-in-out">
                  Join Room
                </button>
              </NavLink>
              <NavLink to={`/home`}>
              <button
                onClick={logout}
                className="text-red-950 px-4 py-2 rounded-md hover:text-red-500 hover:scale-110 transition-transform duration-300 ease-in-out"
              >
                {" "}
                Logout
              </button>
              </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
