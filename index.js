const MyForm = (() => {
    const FieldNameEnum = {
        FIO: 'fio',
        MAIL: 'email',
        PHONE: 'phone',
    };


    class Validators {

        static getNumbersSumFromString(value) {
            if (typeof value !== 'string') {
                throw new Error('Value must be String type');
            }
            return value.replace(/\D/g, '').split('').map((el) => Number(el)).reduce((a, b) => a + b, 0);
        }

        static isEmailValid(value) {
            if (!value) {
                return false;
            }
            const isValidMail = /^([\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+\.)*[\w\!\#$\%\&\'\*\+\-\/\=\?\^\`{\|\}\~]+@((((([a-z0-9]{1}[a-z0-9\-]{0,62}[a-z0-9]{1})|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$/i.test(value);
            return isValidMail && this.isYandexMail(value);
        }

        static isFullNameValid(value) {
            if (!value) {
                return false;
            }
            return value.match(/\S+/g).length === 3;
        }

        static isPhoneValid(value, maxSum) {
            if (!value) {
                return false;
            }
            if (Validators.getNumbersSumFromString(value) > (maxSum || 30)) {
                return false;
            }
            const phoneRegexp = /^\+7\(\d{3}\)\d{3}\-\d{2}\-\d{2}$/;
            return phoneRegexp.test(value);
        }

        static isYandexMail(value) {
            if (!value) {
                return false;
            }
            const allowedDomains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];
            return allowedDomains.filter((el) => value.endsWith(el)).length === 1
        }
    }


    class Field {
        constructor(form, name, label) {
            this.form = form;
            this.name = name;
            this.label = label;
        }

        get value() {
            const element = Field.__getElementByName(this.name);
            if (!element) {
                throw new Error(`Can't find form element with name: ${this.name}`);
            }
            return element.value;
        }

        set value(value) {
            const element = Field.__getElementByName(this.name);
            if (!element) {
                throw new Error(`Can't find form element with name: ${this.name}`);
            }
            element.value = value;
            this.updateValidity();
        }

        static __getElementByName(name) {
            const elements = document.getElementsByName(name);
            if (elements.length === 1) {
                return elements[0];
            } else if (elements.length > 1) {
                throw new Error(`Find more than one element with name ${name}, form invalid`);
            } else {
                throw new Error(`Can't find element by name ${name}, form constructor invalid`);
            }
        }

        isValid() {
            switch (this.name) {
                case FieldNameEnum.FIO:
                    return {
                        valid: Validators.isFullNameValid(this.value),
                        message: 'Некорректо введены ФИО'
                    };
                case FieldNameEnum.MAIL:
                    return {
                        valid: Validators.isEmailValid(this.value),
                        message: 'Некорректный email адрес'
                    };
                case FieldNameEnum.PHONE:
                    const maxSum = 30;
                    return {
                        valid: Validators.isPhoneValid(this.value, maxSum),
                        message: `Телефон должен иметь формат +7(123)123-45-67 и сумма цифр не должна превышать ${maxSum}`
                    };
                default:
                    return {valid: true};
            }
        }

        updateValidity() {
            const element = Field.__getElementByName(this.name);
            const result = this.isValid();
            result.valid ? element.classList.remove('error') : element.classList.add('error');
            if (!result.valid && result.message) {
                this.form.addErrorMessage(result.message);
            }
        }
    }


    class Form {

        constructor(fields) {
            if (!fields || !Array.isArray(fields)) {
                throw new Error('You need to pass fields array to Form class constructor');
            }
            this.error_messages = [];
            this.__setFields(fields);
        }

        static getSubmitUrl() {
            const form = document.getElementById('myForm');
            if (!form) {
                throw new Error('Can\'t find form with id=myForm');
            }
            return form.getAttribute('action');
        };

        __getField(name) {
            return this.fields.find((element) => {
                return element.name === name;
            })
        }

        __onError(json) {
            const resultContainer = document.getElementById('resultContainer');
            resultContainer.innerHTML = json.reason;
            resultContainer.className = '';
            resultContainer.classList.add(json.status);
            this.setSubmitButtonDisabled(false);
        }

        __onProgress(json, event) {
            const resultContainer = document.getElementById('resultContainer');
            if (!resultContainer.classList.contains(json.status)) {
                resultContainer.className = '';
                resultContainer.classList.add(json.status);
            }
            setTimeout(() => this.submit(event), json.timeout);
        }

        __onSuccess(json) {
            const resultContainer = document.getElementById('resultContainer');
            resultContainer.innerHTML = 'Success';
            resultContainer.className = '';
            resultContainer.classList.add(json.status);
            this.setSubmitButtonDisabled(false);
        }

        __setFields(fields) {
            this.fields = [];
            for (const field of fields) {
                this.fields.push(new Field(this, field.name, field.label));
            }
        }

        addErrorMessage(message) {
            if (this.error_messages.indexOf(message) < 0) {
                this.error_messages.push(message);
            }
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
                    if (field && typeof field === 'string') {
                        field.value = data[key];
                    }
                }
            }
        }

        setSubmitButtonDisabled(disabled) {
            const button = document.getElementById('submitButton');
            button.disabled = disabled;
        }

        submit(event) {
            this.updateValidity();
            if (this.validate().isValid) {
                const data = new FormData();
                data.append('json', JSON.stringify(this.getData()));
                this.setSubmitButtonDisabled(true);
                fetch(Form.getSubmitUrl(),
                    {
                        method: event.target.getAttribute('formmethod'),
                        body: data
                    })
                    .then(
                        (response) => {
                            return response.json();
                        }).then((json) => {
                    switch (json.status) {
                        case 'success':
                            this.__onSuccess(json);
                            break;
                        case 'error':
                            this.__onError(json);
                            break;
                        case 'progress':
                            this.__onProgress(json, event);
                            break;
                    }
                });
            }
        }

        updateMessages() {
            const errorsDiv = document.getElementById('form_errors');
            while (errorsDiv.firstChild) {
                errorsDiv.removeChild(errorsDiv.firstChild);
            }
            if (this.error_messages.length > 0) {
                for (const message of this.error_messages) {
                    const div = document.createElement('div');
                    div.innerHTML = message;
                    document.getElementById('form_errors').appendChild(div);
                }
            }
        }

        updateValidity() {
            this.error_messages = [];
            for (const field of this.fields) {
                field.updateValidity();
            }
            this.updateMessages();
        }

        validate() {
            const errorFields = this.fields.filter((field) => {
                return !field.isValid().valid;
            }).map((element) => {
                return element.name;
            });
            return {isValid: !errorFields.length, errorFields}
        }

    }

    const MyForm = new Form([
        {name: FieldNameEnum.FIO, label: 'ФИО'},
        {name: FieldNameEnum.MAIL, label: 'Email'},
        {name: FieldNameEnum.PHONE, label: 'Телефон'}]);

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

    return {
        validate: () => MyForm.validate(),
        getData: () => MyForm.getData(),
        setData: (data) => MyForm.setData(data),
        submit: () => MyForm.submit()
    };
})();

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
console.assert(MyForm.validate().errorFields[0] === 'fio');
