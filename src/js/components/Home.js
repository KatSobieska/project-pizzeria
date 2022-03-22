import { templates, select } from '../settings.js';
import utils from '../utils.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.render(element);
    //thisHome.initWidgets();
  }

  render(element) {
    const thisHome = this;

    const generatedHTML = templates.bookingWidget();

    thisHome.element = utils.createDOMFromHTML(generatedHTML);

    const homeContainer = document.querySelector(select.containerOf.home);

    homeContainer.appendChild(thisHome.element).innerHTML;

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
  }
}

export default Home;
