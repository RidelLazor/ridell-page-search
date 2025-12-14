const RidelLogo = ({ size = "large" }: { size?: "small" | "large" }) => {
  const letters = [
    { char: "R", color: "text-red-500" },
    { char: "i", color: "text-blue-500" },
    { char: "d", color: "text-yellow-500" },
    { char: "e", color: "text-blue-500" },
    { char: "l", color: "text-green-500" },
    { char: "L", color: "text-red-500" },
  ];

  const textSize = size === "large" ? "text-7xl md:text-8xl" : "text-2xl";
  const fontWeight = "font-bold";

  return (
    <div className="flex items-center justify-center select-none">
      {letters.map((letter, index) => (
        <span
          key={index}
          className={`${letter.color} ${textSize} ${fontWeight} tracking-tight`}
          style={{ fontFamily: "'Product Sans', 'Google Sans', sans-serif" }}
        >
          {letter.char}
        </span>
      ))}
    </div>
  );
};

export default RidelLogo;
