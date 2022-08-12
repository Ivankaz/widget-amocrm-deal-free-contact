define(['jquery'], function ($) {
    var CustomWidget = function () {
        var self = this;

        this.callbacks = {
            // отрисовка виджета
            // вызывается при сборке виджета
            render: function () {
                console.log('render');

                // получение контактов
                function getContacts(page = 1) {
                    let contacts = [];

                    return new Promise((resolve, reject) => {
                        // жду данные
                        $.ajax({
                            url: '/api/v4/contacts',
                            method: 'GET',
                            async: false,
                            data: {
                                'limit': 250,
                                'page': page,
                                'with': 'leads'
                            }
                        }).done(function (data) {
                            // если есть контакты
                            if ((typeof (data) === 'object') && (data._embedded.contacts.length !== 0)) {
                                // добавяю их в массив
                                contacts.push(...data._embedded.contacts);

                                // получаю следующую страницу с контактами
                                let getNextContacts = () => {
                                    getContacts(++page).then(result => {
                                        // если контактов больше нет
                                        if (result.length == 0) {
                                            // данные готовы
                                            resolve(contacts);
                                        } else {
                                            // добавяю их в массив
                                            contacts.push(...result);
                                            // получаю следующую страницу с контактами
                                            getNextContacts();
                                        }
                                    }).catch(error => {
                                        // возвращаю ошибку
                                        reject(new Error(error));
                                    });
                                }
                                getNextContacts();
                            } else {
                                // данные готовы
                                resolve(contacts);
                            }
                        }).fail(function (data) {
                            // возвращаю ошибку
                            reject(new Error(`Не удалось получить контакты`));
                        });
                    });
                }

                // получение контактов без сделок
                function getContactsWithoutDeal() {
                    return new Promise((resolve, reject) => {
                        // получаю все контакты
                        getContacts().then(contacts => {
                            // оставляю контакты без сделок
                            let contactsWithoutDeal = contacts.filter(contact => {
                                return contact._embedded.leads.length == 0;
                            });

                            // возвращаю контакты без сделок
                            resolve(contactsWithoutDeal);
                        }).catch(error => {
                            // возвращаю ошибку
                            reject(error);
                        });
                    });
                }

                // получаю контакты без сделок
                getContactsWithoutDeal().then(contactsWithoutDeal => {
                    console.log(contactsWithoutDeal);
                }).catch(error => {
                    console.error(error);
                });
            },
            // сбор необходимой информации, взаимодействие со сторонним сервером
            // вызывается сразу после render одновременно с bind_actions
            init: function () {
                console.log('init');
                return true;
            },
            // навешивает события на действия пользователя
            bind_actions: function () {
                console.log('bind_actions');
                return true;
            },
            // вызывается при щелчке на иконку виджета в области настроек
            // может использоваться для добавления на страницу модального окна
            settings: function () {
                console.log('settings');
                return true;
            },
            // вызывается:
            // 1. при щелчке пользователя на кнопке “Установить/Сохранить” в настройках виджета
            // 2. при отключении виджета
            // можно использовать для отправки введенных в форму данных и смены статуса виджета
            onSave: function () {
                console.log('onSave');
                return true;
            },
            // вызывается:
            // 1. при отключении виджета через меню его настроек
            // 2. при переходе между областями отображения виджета
            // может использоваться для удаления из DOM всех элементов виджета, если он был отключен
            destroy: function () {
                console.log('destroy');
            },
            contacts: {
                // выбрали контакты в списке и кликнули по названию виджета
                selected: function () {
                    console.log('contacts');
                }
            },
            leads: {
                // выбрали сделки в списке и кликнули по названию виджета
                selected: function () {
                    console.log('leads');
                }
            },
            tasks: {
                // выбрали задачи в списке и кликнули по названию виджета
                selected: function () {
                    console.log('tasks');
                }
            }
        };

        return this;
    };

    return CustomWidget;
});