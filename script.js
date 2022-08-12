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
                            // оставляю ID контактов без сделок
                            let contactsWithoutDeal = contacts.filter(contact => {
                                return contact._embedded.leads.length == 0;
                            }).map(contact => {
                                return contact.id;
                            });

                            // возвращаю контакты без сделок
                            resolve(contactsWithoutDeal);
                        }).catch(error => {
                            // возвращаю ошибку
                            reject(error);
                        });
                    });
                }

                /**
                 * создание задачи "Контакт без сделок"
                 * @param entity_id ID контакта
                 */
                function createTaskContactWithoutDeal(entity_id) {
                    // срок выполнения задачи = завтра
                    const complete_till = Math.floor((Date.now() + 24 * 3600 * 1000) / 1000);
                    const text = 'Контакт без сделок';
                    const entity_type = 'contacts';

                    $.ajax({
                        url: '/api/v4/tasks',
                        method: 'POST',
                        data: JSON.stringify([{
                            text,
                            complete_till,
                            entity_id,
                            entity_type
                        }])
                    }).fail(function (data) {
                        console.error('Не удалось создать задачу');
                        return false;
                    });
                }

                /**
                 * получение контактов, по которым ещё не создали задачу "Контакт без сделок"
                 * @param contactsWithoutDeal ID контактов без сделок
                 */
                function getContactsWithoutTask(contactsWithoutDeal) {
                    return new Promise((resolve, reject) => {
                        $.ajax({
                            url: '/api/v4/tasks',
                            method: 'GET',
                            data: JSON.stringify([{
                                'filter': {
                                    'entity_type': 'contacts',
                                    'entity_id': contactsWithoutDeal
                                }
                            }])
                        }).done(function (data) {
                            // по умолчанию считаю, что все контакты без сделки не имеют задачи
                            let contactsWithoutTask = contactsWithoutDeal;

                            // если получили от сервера объект с задачами
                            if (typeof data === 'object') {
                                // получаю контакты, по которым уже создали задачу "Контакт без сделок"
                                let contactsWithTask = data._embedded.tasks.map((task) => {
                                    if (task.text === 'Контакт без сделок') {
                                        return task.entity_id;
                                    }
                                });

                                // оставляю только те контакты, по которым ещё не создали задачу "Контакт без сделок"
                                contactsWithoutTask = contactsWithoutDeal.filter((contactWithoutDeal) => {
                                    return !contactsWithTask.includes(contactWithoutDeal);
                                });
                            }

                            // возвращаю контакты
                            resolve(contactsWithoutTask);
                        }).fail(function (data) {
                            // возвращаю ошибку
                            reject(new Error('Не удалось получить задачи'));
                            return false;
                        });
                    });
                }

                // получаю контакты без сделок
                getContactsWithoutDeal().then(contactsWithoutDeal => {
                    // получаю контакты, для которых ещё не создали задачу "Контакт без сделок"
                    getContactsWithoutTask(contactsWithoutDeal).then(contactsWithoutTask => {
                        // создаю задачу для каждого контакта без сделки
                        contactsWithoutTask.forEach((contactWithoutTask) => {
                            createTaskContactWithoutDeal(contactWithoutTask);
                        });
                    });
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