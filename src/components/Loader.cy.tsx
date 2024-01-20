import React from 'react';
import Loader from './Loader';

describe('<Loader />', () => {
    it('renders', () => {
        cy.mount(<Loader />);
    });

    it("displays the text 'Loading ... '", () => {
        cy.mount(<Loader />);
        cy.get('div[class^="Loader_loader__container"]').within(() => {
            cy.get('h3').should('have.text', 'Loading ... ');
        });
    });
});
