const FieldNameEnum = {
    FIO: 'fio',
    MAIL: 'email',
    PHONE: 'phone',
}


class Validators {

    static isPhoneValid(value) {
        if (!value) {
            return false;
        }
        if (Validators.getNumbersSumFromString(value) > 30) {
            return false;
        }
        const phoneRegexp = /^\+7\(\d{3}\)\d{3}\-\d{2}\-\d{2}$/;
        return phoneRegexp.test(value);
    }

    static isFullNameValid(value) {
        if (!value) {
            return false;
        }
        return value.match(/\S+/g).length === 3;
    }

    static isEmailValid(value) {
        if (!value) {
            return false;
        }
        const allowedDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];
        const isValidMail = /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i.test(value);
        const isValidDomain = allowedDomains.filter((el) => value.endsWith(el)).length === 1;
        return isValidMail && isValidDomain;
    }

    static getNumbersSumFromString(value) {
        if (typeof value !== 'string') {
            throw new Error('Value must be String type');
        }
        ;
        return value.replace(/\D/g, '').split('').map((el) => Number(el)).reduce((a, b) => a + b, 0);
    }
}


class Field {
    constructor(name, label) {
        this.name = name;
        this.label = label;
    }

    isValid() {
        switch (this.name) {
            case FieldNameEnum.FIO:
                return Validators.isFullNameValid(this.value);
            case FieldNameEnum.MAIL:
                return Validators.isEmailValid(this.value);
            case FieldNameEnum.PHONE:
                return Validators.isPhoneValid(this.value);
            default:
                return true;
        }
    }

    get value() {
        const element = this.__getElementByName(this.name);
        if (!element) {
            throw new Error(`Can't find form element with name: ${this.name}`);
        }
        return element.value;
    }

    set value(value) {
        const element = this.__getElementByName(this.name);
        if (!element) {
            throw new Error(`Can't find form element with name: ${this.name}`);
        }
        element.value = value;
        this.updateValidity();
    }

    updateValidity() {
        const element = this.__getElementByName(this.name);
        if (this.isValid()) {
            element.classList.remove('error');
        } else {
            element.classList.add('error');
        }
    }

    __getElementByName(name) {
        const elements = document.getElementsByName(name);
        if (elements.length === 1) {
            return elements[0];
        } else if (elements.length > 1) {
            throw new Error(`Find more than one element with name ${name}, form invalid`);
        } else {
            throw new Error(`Can't find element by name ${name}, form constructor invalid`);
        }
        ;
    }
}


class Form {

    constructor(fields) {
        if (!fields || !Array.isArray(fields)) {
            throw new Error('You need to pass fields array to Form class constructor');
        }
        this.__setFields(fields);
    }

    validate() {
        const errorFields = this.fields.filter((field) => {
            return !field.isValid();
        }).map((element) => {
            return element.name;
        });
        return {isValid: !errorFields.length, errorFields}
    }

    getData() {
        const result = {};
        for (const field of this.fields) {
            result[field.name] = field.value;
        }
        return result;
    }

    setData(data) {
        for (const key of Object.keys(data)) {
            if ([FieldNameEnum.PHONE, FieldNameEnum.FIO, FieldNameEnum.MAIL].indexOf(key) >= 0) {
                const field = this.__getField(key);
                if (field) {
                    field.value = data[key];
                }
            }
        }
    }

    submit(event) {
        this.updateValidity();
        if (!this.validate().isValid) {
            const data = new FormData();
            data.append('json', JSON.stringify(this.getData()));
            this.setSubmitButtonDisabled(true);
            fetch(event.target.getAttribute('action'),
                  {
                      method: event.target.getAttribute('formmethod'),
                      body: data
                  })
                .then(
                    (response) => {
                        return response.json();
                    }).then((json) => {
                console.log(json);
                switch (json.status) {
                    case 'success':
                        this.__onSuccess();
                    case 'error':
                        this.__onError(json);
                    case 'progress':
                        this.__onProgress(json, event);
                }
                this.setSubmitButtonDisabled(false);
            });
        }
    }

    __setFields(fields) {
        this.fields = [];
        for (const field of fields) {
            this.fields.push(new Field(field.name, field.label));
        }
    }

    __getField(name) {
        return this.fields.find((element) => {
            return element.name === name;
        })
    }

    __getSubmitUrl() {
        const button = document.getElementById('submitButton');
        return button.getAttribute('action');
    }

    updateValidity() {
        for (const field of this.fields) {
            field.updateValidity();
        }
    }

    setSubmitButtonDisabled(disabled) {
        const button = document.getElementById('submitButton');
        button.disabled = disabled;
    }

    __onSuccess(json) {
        const resultContainer = document.getElementById('resultContainer');
        resultContainer.innerHTML = 'Success';
        resultContainer.className = '';
        resultContainer.classList.add(json.status);
    }

    __onError(json) {
        const resultContainer = document.getElementById('resultContainer');
        resultContainer.innerHTML = json.reason;
        resultContainer.className = '';
        resultContainer.classList.add(json.status);
    }

    __onProgress(json, event) {
        if (!event.target.classList.contains(json.status)) {
            event.target.className = '';
            event.target.classList.add(json.status);
        }
        setTimeout(() => this.submit(event), json.timeout);
    }

}

const MyForm = new Form([
    {name: 'fio', label: 'FIO'},
    {name: 'email', label: 'EMAIL'},
    {name: 'phone', label: 'PHONE'}]);

document.addEventListener(
    'DOMContentLoaded',
    () => {
        document.getElementById('submitButton').onclick = (event) => MyForm.submit(event);
    },
    false);

/*

document.addEventListener(
    'DOMContentLoaded',
    () => {
        document.getElementById('myForm').onchange = changeEventHandler;
    },
    false);

const changeEventHandler = (event) => {
    console.log(event);
    MyForm.updateValidity();
    MyForm.setSubmitButtonDisabled(!MyForm.validate().isValid);
}
*/


console.assert(Validators.getNumbersSumFromString('+7(222)444-55-66') === 47);
console.assert(Validators.getNumbersSumFromString('+7(111)222-33-11') === 24);
console.log(MyForm);
MyForm.setData({fio: 'Ivanov Ivan Ivanovich', phone: '+7(111)111-11-11', email: 'aa@ya.ru'});
const data = MyForm.getData();
console.assert(data.fio === 'Ivanov Ivan Ivanovich');
console.assert(data.phone === '+7(111)111-11-11');
console.assert(data.email === 'aa@ya.ru');
console.assert(MyForm.validate().isValid === true);
console.assert(MyForm.validate().errorFields.length === 0);
MyForm.setData({fio: 'Ivanov Ivan'});
console.assert(MyForm.validate().isValid === false);
console.assert(MyForm.validate().errorFields.length === 1);
console.assert(MyForm.validate().errorFields[0] === FieldNameEnum.FIO);