import React from "react";

type GuiCardProps = {
  title: string;
  imageSrc: string;
  altText: string;
  category: string;
  technologies: string;
  link: string;
};

export const GuiCard: React.FC<GuiCardProps> = ({
  title,
  imageSrc,
  altText,
  category,
  technologies,
  link,
}) => {
  const handleClick = () => {
    window.open(link, "_self");
  };

  return (
    <div className="gui-card">
      <div className="gui-card-inner">
        <div className="gui-card-front">
          <img src={imageSrc} alt={altText} className="sim-gif" />
          <h2>{title}</h2>
        </div>

        <div className="gui-card-back" onClick={handleClick}>
          <div className="card_info">
            <span className="card_category">{category}</span>
            <br />
            <span className="card_using">{technologies}</span>
          </div>
          <div className="click_more">Click for more information!</div>
        </div>
      </div>
    </div>
  );
};

