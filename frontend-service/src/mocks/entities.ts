import MockAdapter from 'axios-mock-adapter';

const mockEntites = (mock: MockAdapter) => {
    // Get all entities, TODO: remove
    mock.onGet('/api/entities/all').reply(() => [
        200,
        {
            nodes: [
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    properties: {
                        name: 'טיול בר מצווה ללונדון',
                        destination: 'לונדון',
                        startDate: '2013-01-01',
                        endDate: '2013-01-10',
                        _id: '100',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    properties: {
                        name: 'טיול משפחות בצרפת והולנד',
                        destination: 'הולנד',
                        _id: '101',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    properties: {
                        name: 'סקי באיטליה',
                        destination: 'איטליה',
                        startDate: '2017-11-29',
                        endDate: '2017-12-05',
                        _id: '102',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    properties: {
                        name: 'מסיבות בקפרסיןי',
                        destination: 'קפריסין',
                        _id: '103',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7e',
                    properties: {
                        name: 'חי את החלום בבהאמה',
                        destination: 'בהאמה',
                        startDate: '2020-07-17',
                        endDate: '2020-08-03',
                        _id: '104',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        firstName: 'איילה',
                        lastName: 'נסיעות',
                        age: 40,
                        gender: false,
                        agentId: 'a1b2c3',
                        _id: '105',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        firstName: 'ארנון',
                        lastName: 'פז',
                        age: 46,
                        gender: true,
                        agentId: 'd4e5f6',
                        _id: '106',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        firstName: 'סקי',
                        lastName: 'דיל',
                        age: 35,
                        gender: true,
                        agentId: 'g7h8i9',
                        _id: '107',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'איתי',
                        lastName: 'לוי',
                        age: 30,
                        gender: true,
                        _id: '108',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'אייל',
                        lastName: 'גולן',
                        age: 42,
                        gender: true,
                        _id: '109',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'נועה',
                        lastName: 'קירל',
                        age: 20,
                        gender: false,
                        _id: '110',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'סטטיק',
                        lastName: 'זה חזק',
                        age: 28,
                        gender: true,
                        _id: '111',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'גל',
                        lastName: 'גדות',
                        age: 35,
                        gender: false,
                        _id: '112',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'בר',
                        lastName: 'רפאלי',
                        age: 36,
                        gender: false,
                        _id: '113',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'סבא',
                        lastName: 'טוביה',
                        age: 76,
                        gender: true,
                        _id: '114',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'אדיר',
                        lastName: 'מילר',
                        age: 43,
                        gender: true,
                        _id: '115',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'עודד',
                        lastName: 'פז',
                        age: 36,
                        gender: true,
                        _id: '116',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c7f',
                    properties: {
                        firstName: 'אלונה',
                        lastName: 'טל',
                        age: 38,
                        gender: false,
                        _id: '117',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    properties: {
                        company: 'מזוודה בעם',
                        color: 'שחור',
                        weight: 12,
                        _id: '118',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    properties: {
                        company: 'מזוודה בעם',
                        color: 'כחול',
                        weight: 16,
                        _id: '119',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    properties: {
                        company: 'מזוודה בעם',
                        color: 'שחור',
                        weight: 8,
                        _id: '120',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    properties: {
                        company: 'ריקושט',
                        color: 'שחור',
                        weight: 7,
                        _id: '121',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    properties: {
                        company: 'ריקושט',
                        color: 'שחור',
                        weight: 10,
                        _id: '122',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c89',
                    properties: {
                        company: 'ריקושט',
                        color: 'שחור',
                        weight: 21,
                        _id: '123',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    properties: {
                        company: 'at&t',
                        number: 543458942,
                        _id: '124',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    properties: {
                        company: 'vodaphone',
                        number: 154458942,
                        _id: '125',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    properties: {
                        company: 'pelephone',
                        number: 5434535628,
                        _id: '126',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c88',
                    properties: {
                        company: 'vodaphone',
                        number: 1958535628,
                        _id: '127',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    properties: {
                        model: 'גלקסי S12',
                        color: 'שחור',
                        serialNumber: '12341231231',
                        _id: '128',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    properties: {
                        model: 'גלקסי S13',
                        color: 'כחול',
                        serialNumber: '12341781231',
                        _id: '129',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    properties: {
                        model: 'אייפון 13 מקס פרו ',
                        color: 'לבן',
                        serialNumber: '45678912358',
                        _id: '130',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    properties: {
                        model: 'וואן פלאס S12',
                        color: 'ירוק',
                        serialNumber: '12456731231',
                        _id: '131',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    properties: {
                        model: 'גלקסי A70',
                        color: 'שחור',
                        serialNumber: '13941231231',
                        _id: '132',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c87',
                    properties: {
                        model: 'גלקסי S12',
                        color: 'לבן',
                        serialNumber: '12365431231',
                        _id: '133',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    properties: {
                        hotelName: 'hotel la vie',
                        hotelChain: 'novo',
                        checkInDate: '2017-05-12',
                        checkOutDate: '2017-05-16',
                        country: 'צרפת',
                        _id: '134',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    properties: {
                        hotelName: 'hotel la butique',
                        checkInDate: '2020-08-10',
                        checkOutDate: '2020-08-16',
                        country: 'קפריסין',
                        _id: '135',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    properties: {
                        hotelName: 'hotel la grande',
                        hotelChain: 'novo',
                        checkInDate: '2019-01-12',
                        checkOutDate: '2019-01-16',
                        country: 'בהאמה',
                        _id: '136',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c83',
                    properties: {
                        hotelName: 'hotel la la',
                        checkInDate: '2013-04-02',
                        checkOutDate: '20173-04-09',
                        country: 'איטליה',
                        _id: '137',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AA123',
                        departureDate: '2020-01-15T13:30:00.000Z',
                        landingDate: '2020-01-15T14:30:00.000Z',
                        from: 'NYC',
                        to: 'ORL',
                        planeType: 'B747-400',
                        _id: '138',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AA123',
                        departureDate: '2020-01-17T13:30:00.000Z',
                        landingDate: '2020-01-17T14:30:00.000Z',
                        from: 'NYC',
                        to: 'ORL',
                        planeType: 'B747-200',
                        _id: '139',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AA123',
                        departureDate: '2020-01-19T13:30:00.000Z',
                        landingDate: '2020-01-19T14:30:00.000Z',
                        from: 'NYC',
                        to: 'ORL',
                        planeType: 'B747-300',
                        _id: '140',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'ACA156',
                        departureDate: '2020-03-20T13:30:00.000Z',
                        landingDate: '2020-03-20T15:30:00.000Z',
                        from: 'TLV',
                        to: 'CYP',
                        planeType: 'A380-400',
                        _id: '141',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'ACA154',
                        departureDate: '2020-03-20T15:30:00.000Z',
                        landingDate: '2020-03-20T17:30:00.000Z',
                        from: 'CYP',
                        to: 'TLV',
                        planeType: 'A380-400',
                        _id: '142',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'ACA157',
                        departureDate: '2020-03-10T13:30:00.000Z',
                        landingDate: '2020-03-10T15:30:00.000Z',
                        from: 'TLV',
                        to: 'CYP',
                        planeType: 'A320-400',
                        _id: '143',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'ACA156',
                        departureDate: '2020-03-10T15:30:00.000Z',
                        landingDate: '2020-03-10T17:30:00.000Z',
                        from: 'CYP',
                        to: 'TLV',
                        planeType: 'A320-400',
                        _id: '144',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AFR432',
                        departureDate: '2020-03-20T13:30:00.000Z',
                        landingDate: '2020-03-20T15:30:00.000Z',
                        from: 'TLV',
                        to: 'PAR',
                        planeType: 'A380-400',
                        _id: '145',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AFR431',
                        departureDate: '2020-05-20T15:30:00.000Z',
                        landingDate: '2020-05-20T17:30:00.000Z',
                        from: 'CYP',
                        to: 'PAR',
                        planeType: 'A380-400',
                        _id: '146',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AFR433',
                        departureDate: '2020-06-10T13:30:00.000Z',
                        landingDate: '2020-06-10T15:30:00.000Z',
                        from: 'PAR',
                        to: 'TLV',
                        planeType: 'A320-400',
                        _id: '147',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'AFR437',
                        departureDate: '2020-06-10T15:30:00.000Z',
                        landingDate: '2020-06-10T17:30:00.000Z',
                        from: 'PAR',
                        to: 'TLV',
                        planeType: 'A320-400',
                        _id: '148',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'LY548',
                        departureDate: '2017-11-29T15:30:00.000Z',
                        landingDate: '2017-11-29T17:30:00.000Z',
                        from: 'TLV',
                        to: 'MIL',
                        planeType: 'B787-200',
                        _id: '149',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'LY549',
                        departureDate: '2017-11-29T05:00:00.000Z',
                        landingDate: '2017-11-29T07:00:00.000Z',
                        from: 'TLV',
                        to: 'MIL',
                        planeType: 'B787-200',
                        _id: '150',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'LY348',
                        departureDate: '2017-12-05T15:30:00.000Z',
                        landingDate: '2017-12-05T17:30:00.000Z',
                        from: 'MIL',
                        to: 'TLV',
                        planeType: 'B787-200',
                        _id: '151',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'LY349',
                        departureDate: '2017-12-05T05:00:00.000Z',
                        landingDate: '2017-12-05T07:00:00.000Z',
                        from: 'MIL',
                        to: 'TLV',
                        planeType: 'B787-200',
                        _id: '152',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'KLM856',
                        departureDate: '2020-07-17T05:00:00.000Z',
                        landingDate: '2020-07-17T07:00:00.000Z',
                        from: 'BHM',
                        to: 'TLV',
                        planeType: 'B787-200',
                        _id: '153',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c81',
                    properties: {
                        flightNumber: 'KLM857',
                        departureDate: '2020-07-17T15:00:00.000Z',
                        landingDate: '2020-07-17T17:00:00.000Z',
                        from: 'BHM',
                        to: 'TLV',
                        planeType: 'B787-200',
                        _id: '154',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    properties: {
                        name: '1234123412341234',
                        company: 'visa',
                        expirtaionDate: '2025-12-12',
                        monthlyAmount: 6500,
                        _id: '155',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    properties: {
                        name: '456456456456456',
                        company: 'card',
                        expirtaionDate: '2022-06-12',
                        monthlyAmount: 12300,
                        _id: '156',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    properties: {
                        name: '687687687687687',
                        company: 'visa',
                        expirtaionDate: '2020-08-30',
                        monthlyAmount: 3000,
                        _id: '157',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    properties: {
                        name: '159159159159159',
                        company: 'card',
                        expirtaionDate: '2026-01-19',
                        monthlyAmount: 6500,
                        _id: '158',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c85',
                    properties: {
                        name: '675676567656765',
                        company: 'visa',
                        expirtaionDate: '2026-02-22',
                        monthlyAmount: 6500,
                        _id: '159',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c84',
                    properties: {
                        name: 'hara dira',
                        checkInDate: '2018-05-12',
                        checkOutDate: '2018-05-16',
                        country: 'שומקום',
                        _id: '160',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c84',
                    properties: {
                        name: 'hara makom',
                        checkInDate: '2018-08-09',
                        checkOutDate: '2018-08-21',
                        country: 'משעמם',
                        _id: '161',
                    },
                },
            ],
            links: Array.from({ length: 100 }, () => {
                return { source: String(Math.floor(Math.random() * 62) + 100), target: String(Math.floor(Math.random() * 62) + 100), value: 1 };
            }),
        },
    ]);

    // Get entities by category
    mock.onPost(/\/api\/entities\/filter\/[0-9a-fA-F]{24}/).reply(() => [
        200,
        {
            rows: [
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        _id: '61f28035d372f97e321b1ceb',
                        firstName: 'איילה',
                        lastName: 'נסיעות',
                        age: 40,
                        gender: false,
                        agentId: 'a1b2c3',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        _id: '61f28035d372f97e321b1cec',
                        firstName: 'ארנון',
                        lastName: 'פז',
                        age: 46,
                        gender: true,
                        agentId: 'd4e5f6',
                    },
                },
                {
                    templateId: '61e3ea6e4d51a83e87e83c80',
                    properties: {
                        _id: '61f28035d372f97e321b1ced',
                        firstName: 'סקי',
                        lastName: 'דיל',
                        age: 35,
                        gender: true,
                        agentId: 'g7h8i9',
                    },
                },
            ],
        },
    ]);

    mock.onGet(/\/api\/entities\/[0-9a-fA-F]{24}\?expanded=true/).reply((config) => [
        200,
        {
            entity: {
                templateId: '61e3ea6e4d51a83e87e83c7f',
                properties: {
                    firstName: 'נועה',
                    lastName: 'קירל',
                    age: 20,
                    gender: false,
                    _id: config.url!.split('/')[2].split('?')[0],
                },
            },
            connections: [
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                        properties: {
                            name: 'טיול בר מצווה ללונדון',
                            destination: 'לונדון',
                            startDate: '2013-01-01',
                            endDate: '2013-01-10',
                            _id: '61e3ea6e4d51a82e87e83c7f',
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e83c7c',
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c80',
                        properties: {
                            firstName: 'איילה',
                            lastName: 'נסיעות',
                            age: 40,
                            gender: false,
                            agentId: 'a1b2c3',
                            _id: '61e3ea6e4d51582e87e83c7f',
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e43c7c',
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c81',
                        properties: {
                            flightNumber: 'AA123',
                            departureDate: '2020-01-19T13:30:00.000Z',
                            landingDate: '2020-01-19T14:30:00.000Z',
                            from: 'NYC',
                            to: 'ORL',
                            planeType: 'B747-300',
                            _id: '61e3ea8e4d51a82e87e83c7f',
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a83e87e43c7c',
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c81',
                        properties: {
                            flightNumber: 'ACA156',
                            departureDate: '2020-03-20T13:30:00.000Z',
                            landingDate: '2020-03-20T15:30:00.000Z',
                            from: 'TLV',
                            to: 'CYP',
                            planeType: 'A380-400',
                            _id: '61e3ea8e4d51a82e77e83c7f',
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e4d51a23e87e43c7c',
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        properties: {
                            hotelName: 'hotel la butique',
                            checkInDate: '2020-08-10',
                            checkOutDate: '2020-08-16',
                            country: 'קפריסין',
                            _id: '61e3ea8e4d51a82e77183c7f',
                        },
                    },
                },
                {
                    relationship: {
                        templateId: '61e3ea6e3d51a83e87e43c7c',
                    },
                    entity: {
                        templateId: '61e3ea6e4d51a83e87e83c84',
                        properties: {
                            name: 'hara dira',
                            checkInDate: '2018-05-12',
                            checkOutDate: '2018-05-16',
                            country: 'שומקום',
                            _id: '61e32a8e4d51a82e77e83c7f',
                        },
                    },
                },
            ],
        },
    ]);

    // Get specific entity
    mock.onGet(/\/api\/entities\/[0-9a-fA-F]{24}/).reply((config) => {
        return [
            200,
            {
                nodes: [
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7e',
                        properties: {
                            name: 'סקי באיטליה',
                            destination: 'איטליה',
                            startDate: '2017-11-29',
                            endDate: '2017-12-05',
                            _id: config.url!.split('/')[3],
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c80',
                        properties: {
                            firstName: 'ארנון',
                            lastName: 'פז',
                            age: 46,
                            gender: true,
                            agentId: 'd4e5f6',
                            _id: '1001',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'גל',
                            lastName: 'גדות',
                            age: 35,
                            gender: false,
                            _id: '1002',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'בר',
                            lastName: 'רפאלי',
                            age: 36,
                            gender: false,
                            _id: '1003',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'סבא',
                            lastName: 'טוביה',
                            age: 76,
                            gender: true,
                            _id: '1004',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c7f',
                        properties: {
                            firstName: 'אדיר',
                            lastName: 'מילר',
                            age: 43,
                            gender: true,
                            _id: '1005',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c89',
                        properties: {
                            company: 'ריקושט',
                            color: 'שחור',
                            weight: 21,
                            _id: '1006',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c88',
                        properties: {
                            company: 'at&t',
                            number: 543458942,
                            _id: '1007',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c88',
                        properties: {
                            company: 'vodaphone',
                            number: 1958535628,
                            _id: '1008',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c87',
                        properties: {
                            model: 'גלקסי A70',
                            color: 'שחור',
                            serialNumber: '13941231231',
                            _id: '1009',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c87',
                        properties: {
                            model: 'גלקסי S12',
                            color: 'לבן',
                            serialNumber: '12365431231',
                            _id: '1010',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        properties: {
                            hotelName: 'hotel la vie',
                            hotelChain: 'novo',
                            checkInDate: '2017-05-12',
                            checkOutDate: '2017-05-16',
                            country: 'צרפת',
                            _id: '1011',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c83',
                        properties: {
                            hotelName: 'hotel la la',
                            checkInDate: '2013-04-02',
                            checkOutDate: '20173-04-09',
                            country: 'איטליה',
                            _id: '1012',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c85',
                        properties: {
                            name: '159159159159159',
                            company: 'card',
                            expirtaionDate: '2026-01-19',
                            monthlyAmount: 6500,
                            _id: '1013',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c85',
                        properties: {
                            name: '675676567656765',
                            company: 'visa',
                            expirtaionDate: '2026-02-22',
                            monthlyAmount: 6500,
                            _id: '1014',
                        },
                    },
                    {
                        templateId: '61e3ea6e4d51a83e87e83c84',
                        properties: {
                            name: 'hara makom',
                            checkInDate: '2018-08-09',
                            checkOutDate: '2018-08-21',
                            country: 'משעמם',
                            _id: '1015',
                        },
                    },
                ],
                links: [
                    ...Array.from({ length: 10 }, () => {
                        return {
                            source: String(Math.floor(Math.random() * 14) + 1001),
                            target: String(Math.floor(Math.random() * 14) + 1001),
                            value: 1,
                        };
                    }),
                    ...Array.from({ length: 15 }, (_i, index) => {
                        return { source: config.url!.split('/')[3], target: String(index + 1001), value: 5 };
                    }),
                ],
            },
        ];
    });

    // Create
    mock.onPost('/api/entities').reply(() => [
        200,
        {
            _id: '61e3ea6e4d51a83e87e83c7e',
        },
    ]);

    // Update
    mock.onPut(/\/api\/entities\/[0-9a-fA-F]{24}/).reply((config) => {
        return [
            200,
            {
                templateId: '61e3ea6e4d51a83e87e83c7f',
                properties: {
                    firstName: 'נועה',
                    lastName: 'קירללללל',
                    age: 20,
                    gender: false,
                    _id: config.url!.split('/')[2].split('?')[0],
                },
            },
        ];
    });

    // Delete
    mock.onDelete(/\/api\/entities\/[0-9a-fA-F]{24}/).reply(() => {
        return [200, {}];
    });
};

export { mockEntites };
