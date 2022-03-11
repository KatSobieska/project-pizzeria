/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();

    }
    renderInMenu(){
      const thisProduct = this;

      /* generate HTML based on template */

      const generatedHTML = templates.menuProduct(thisProduct.data);

      /* create element using utils.createElementFromHTML */

      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      /* find menu container */

      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */

      menuContainer.appendChild(thisProduct.element);
    }
    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

    }
    initAccordion(){
      const thisProduct = this;

      /* START: add event listener to clickable trigger on event click */

      thisProduct.accordionTrigger.addEventListener('click', function(event){
        console.log('clicked');

        /* prevent default action for event */

        event.preventDefault();

        /* find active product (product with class active) */

        const activeProduct = document.querySelector('article.active');

        /* if there is active product and it's not thisProduct.element, remove class active from it */

        if(activeProduct && activeProduct != thisProduct.element){
          activeProduct.classList.toggle('active');
        }
        /* toggle active class on thisProduct.element */

        thisProduct.element.classList.toggle('active');
      });
    }
    initOrderForm (){
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){thisProduct.processOrder();});
    }
    processOrder() {
      const thisProduct = this;
    
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
    
      // set price to default price
      let price = thisProduct.data.price;
    
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
    
        // for every option in this category
        for(let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          /* check if there is param with a name of paramId in formData and if it includes option Id */
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected) {
            /* check if the option is not default */
            if(!option.default == true) {
              /* add option price to price variable */
              price += option.price;
            }
          } else {
            /* check if the option is default */
            if(option.default == true) {
              /* reduce price variable */
              price -= option.price;
            }
          }
        
          /* find image for particular cat-option */
          const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);

          /* check if image has been found and if option is selected -> if yes, show the image, if not, hide the image */

          if(optionImage){
            if(optionSelected) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
        
      }

      /* multiply price by amount */
      price *= thisProduct.amountWidget.value;

      thisProduct.priceSingle = price;
      /* update calculated price in the HTML */
      thisProduct.priceElem.innerHTML = price;
    }
    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {

        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.data.price,
        price: thisProduct.data.price * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),

      };

      //priceSingle += thisProduct;

      return productSummary;
    }
    prepareCartProductParams(){
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.form);

      const params = {};
    
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        // create category param in params const e.g. params = { ingredients: {name: 'Ingredients', options:{}}}
        params[paramId] = {
          label: param.label,
          options: {}
        };
    
        // for every option in this category
        for(let optionId in param.options) {
          const option = param.options[optionId];

          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          if(optionSelected) {
            params[paramId].options = option;
          }
        }
        
      }
      return params;
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;

      thisWidget.value = settings.amountWidget.defaultValue;
      
      const newValue = parseInt(value);

      if(thisWidget.value !== newValue && !isNaN(newValue) ) {
        thisWidget.value = newValue;
      }

      if(thisWidget.value <= settings.amountWidget.defaultMin){
        thisWidget.value = settings.amountWidget.defaultMin;
      }
      if(thisWidget.value >= settings.amountWidget.defaultMax){
        thisWidget.value = settings.amountWidget.defaultMax;
      }
      
      thisWidget.input.value = thisWidget.value;

      thisWidget.announce();
    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){thisWidget.setValue(thisWidget.input.value);});
      thisWidget.linkDecrease.addEventListener('click', function(event){event.preventDefault(); thisWidget.setValue(thisWidget.value - 1);});
      thisWidget.linkIncrease.addEventListener('click', function(event){event.preventDefault(); thisWidget.setValue(thisWidget.value + 1);});
    }

    announce(){
      const thisWidget = this;

      const event = new CustomEvent('updated',{
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);

    } 
  }
  class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = element.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = element.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = element.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = element.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = element.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = element.querySelector(select.cart.totalNumber);
      thisCart.dom.form = element.querySelector(select.cart.form);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    }
    
    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      this.update();

    }
    update(){
      const thisCart = this;

      let deliveryFee = settings.cart.defaultDeliveryFee;

      let totalNumber = 0;
      let subtotalPrice = 0;

      for(let product of thisCart.products){
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }
      if(totalNumber <= 0){
        deliveryFee = 0;
      }

      thisCart.totalPrice = subtotalPrice + deliveryFee;

      thisCart.dom.totalNumber.innerHTML = totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      
      for(let totalPriceDOM of thisCart.dom.totalPrice ){
        totalPriceDOM.innerHTML = thisCart.totalPrice;
      }
    }
    remove(cartProduct){
      const thisCart = this;

      cartProduct.dom.wrapper.remove();

      const allRemovedValues = thisCart.products.splice(cartProduct);
      console.log('removed', allRemovedValues);
      thisCart.update();
    }


  }
  class CartProduct{
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }
    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidgetElem = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
    
    }
    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidgetElem);
      thisCartProduct.dom.amountWidgetElem.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount.value;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;


      });
    }
    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
      
    }
  }

  const app = {
    initMenu: function(){
      const thisApp = this;
      console.log('thisApp.data:', thisApp.data);
      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function (){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);

          thisApp.data.products = parsedResponse;

          thisApp.initMenu();
        });

      console.log('thisApp.data', JSON.stringify(thisApp.data));
    
    },
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initCart();
    },
  };

  
  app.init();
}
  