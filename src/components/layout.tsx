import { FunctionComponent, ReactNode } from "react";
import Link from "next/link";
// import { useAuth } from "src/auth/useAuth";

interface IProps {
  main: ReactNode;
}

const Layout: FunctionComponent<IProps> = ({ main }) => {
  const authenticated = false;
  const logout = () => {};

  return (
    <div className="mx-auto text-white bg-gray-900 max-w-screen-2xl">
      <nav className="h-16 bg-gray-800">
        <div className="flex items-center justify-between h-16 px-6">
          <Link href="/">
            <a>
              <img
                src="/home-color.svg"
                alt="home house"
                className="inline w-6"
              />
            </a>
          </Link>
          {authenticated ? (
            <>
              <Link href="/houses/add">
                <a>Add House</a>
              </Link>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/auth">
              <a>Sign Up</a>
            </Link>
          )}
        </div>
      </nav>
      <main style={{ minHeight: "calc(100vh - 64px)" }}>{main}</main>
    </div>
  );
};

export default Layout;
