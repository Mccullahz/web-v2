import { Link } from "react-router-dom";
import { IoArrowForwardOutline, IoArrowDown } from "react-icons/io5";

export const Hero: React.FC = () => {
  return (
    <section
      id="home"
      aria-label="headshot"
      className="bg-[#D2DBDD] min-h-screen pt-50"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 md:grid-cols-2 md:items-center">

          {/* image */}
          <figure className="overflow-hidden rounded-xl max-w-[440px] max-h-[500px]">
            <img
              src="/images/headshot.jpg"
              alt="Headshot"
              className="h-full w-full object-cover"
            />
          </figure>

          {/* content */}
          <div className="relative">

            <p className="mb-2 font-poppins text-lg font-bold text-sky-500">
              Zylar McCullah
            </p>

            <h1 className="mb-8 font-poppins text-3xl font-extrabold uppercase leading-tight text-black">
              Developer & Student
            </h1>
            
	    <ul className="space-y-4">
              <li>
                <Link
                  to="/gui"
                  className="flex items-center gap-2 font-poppins font-medium text-black transition-colors hover:text-sky-500"
                >
                  <span>Portfolio Page</span>
                  <IoArrowForwardOutline className="text-xl transition-transform duration-500 hover:rotate-[-45deg]" />
                </Link>
              </li>

              <li>
                <a
                  href="https://techcyberwarriors.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-poppins font-medium text-black transition-colors hover:text-sky-500"
                >
                  <span>Collegiate Cyber Security Experience</span>
		  <IoArrowForwardOutline className="text-xl transition-transform duration-500 hover:rotate-[-45deg]" />

                </a>
              </li>

              <li>
                <a
                  href="https://github.com/Mccullahz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-poppins font-medium text-black transition-colors hover:text-sky-500"
                >
                  <span>Other Projects</span>
		  <IoArrowForwardOutline className="text-xl transition-transform duration-500 hover:rotate-[-45deg]" />
                </a>
              </li>
            </ul>

            
            <ul className="mt-10">
              <li className="flex flex-col">
                <strong className="font-poppins text-lg font-extrabold text-black">
                  Fourth Year
                </strong>
                <span className="font-poppins text-sm text-gray-600">
                  Computer Science Major
                </span>
              </li>
            </ul>

            {/* down arrow */}
            <a
              href="#workexp"
              aria-label="scroll-down"
              className="absolute -bottom-20 left-0 md:flex items-center justify-center text-5xl text-black animate-bounce hover:text-sky-500 transition-transform"
            >
              <IoArrowDown />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

