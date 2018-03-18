import React from 'react';

const Introduction = ({text, instructions}) => {
    return (
        <div className="content-region">
            <div className="page-container">
                <section className="introduction">
                    {text ? <div className="introduction-text"
                                 dangerouslySetInnerHTML={{__html: text}}></div> : null}
                    {instructions ? <div className="instructions-text"
                                         dangerouslySetInnerHTML={{__html: instructions}}></div> : null}
                </section>
            </div>
        </div>
    )
};

export default Introduction;