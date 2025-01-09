import React, { useState } from 'react';

const Card = ({ type, index, total, isActive, onClick }) => {
  const suitIcons = {
    S: '♠', // Spades
    C: '♣', // Clubs
    H: '♥', // Hearts
    D: '♦', // Diamonds
  };

  const suit = type[0]; // First character represents the suit
  const value = type.slice(1); // Remaining characters represent the value
  const isRed = suit === 'H' || suit === 'D'; // Red suits: Hearts and Diamonds

  // Dynamically calculate rotation based on the card's index
  const rotation = `rotate(${(-10 + (20 / (total - 1)) * index).toFixed(2)}deg)`;

  return (
    <div
      onClick={() => onClick(index)} // Corrected to onClick
      className={`relative w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-28 bg-white rounded-xl shadow-lg 
        flex flex-col justify-center items-center 
        overflow-hidden transform transition-all duration-300 
        hover:w-32 hover:h-40 hover:p-4 hover:z-10 hover:rotate-0 
        ${isRed ? 'text-red-500' : 'text-black'} ${isActive ? 'w-32 h-40' : ''} border border-gray-300 cursor-pointer`}
      style={{
        transform: isActive ? 'rotate(0)' : rotation, // Apply dynamic rotation or straight rotation if active
        marginLeft: '-2rem', // Overlap cards
        width: isActive? '8rem':'',
        height: isActive? '10rem':'',
        zIndex : isActive? 'z-10':''
      }}
    >
      {/* Card Content */}
      <div className="text-center">
        <span className="text-sm sm:text-lg md:text-xl">{suitIcons[suit]}</span>
        <h2 className="text-xs sm:text-sm md:text-lg font-bold">{value}</h2>
      </div>
    </div>
  );
};

// const GamePage = () => {
//   const [activeIndex, setActiveIndex] = useState(null); // State to track the active card

//   const array = [
//     'S2', 'C4', 'SA', 'H10', 'D7',
//     'S5', 'H7', 'C9', 'DA', 'H3',
//     'S8', 'C2', 'D4', 'H5', 'C6',
//     'D10', 'H9', 'S3', 'C7', 'D8',
//   ]; // 20 cards

//   const handleCardClick = (index) => {
//     setActiveIndex(index === activeIndex ? null : index); // Toggle active card
//   };

//   return (
//     <div className="flex justify-center items-center p-8 bg-green-500 min-h-screen">
//       <div className="flex relative">
//         {array.map((type, index) => (
//           <Card
//             type={type}
//             index={index}
//             total={array.length}
//             key={index}
//             isActive={activeIndex === index} // Active card styling
//             onClick={handleCardClick} // Corrected to onClick
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

export default Card;
