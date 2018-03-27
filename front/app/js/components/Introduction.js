import React from 'react';
import { Card } from '../rh-components/rh-Card';

const Introduction = ({ text, instructions }) => {
  return (
    <Card className="margin-bottom-double">
      {text ? (
        <div
          className="introduction-text"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : null}
      {instructions ? (
        <div
          className="instructions-text"
          dangerouslySetInnerHTML={{ __html: instructions }}
        />
      ) : null}
    </Card>
  );
};

export default Introduction;
