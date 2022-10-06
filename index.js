const fs = require('fs')
const translate = require('@vitalets/google-translate-api')

const CONFIG_FILE_PATH = `${process.env.plugin_dir}/language_config`
const DEFAULT_RESPONSE = JSON.stringify({
    result: [
        {
            Title: 'Translate',
            Subtitle: 'type text to translate or set `from`->`to` languages: `:set en de`',
            IcoPath: 'Images\\liber_icon.png',
        },
    ],
})

let { method, parameters: params } = JSON.parse(process.argv[2])

if (!fs.existsSync(CONFIG_FILE_PATH)) {
    fs.writeFileSync(CONFIG_FILE_PATH, `en,de`)
}
let [from, to] = fs.readFileSync(CONFIG_FILE_PATH).toString('utf8').trim().split(',')

Promise.resolve().then(async () => {
    try {
        await main(method, params)
    } catch (e) {
        console.log(
            JSON.stringify({
                result: [
                    {
                        Title: 'Error',
                        Subtitle: e.message || '',
                        IcoPath: 'Images\\google_tr_icon.png',
                    },
                ],
            })
        )
    }
})

async function main(method, params) {
    if (method === 'query' && (params.length === 0 || (params.length === 1 && !params[0]))) {
        return console.log(DEFAULT_RESPONSE)
    } else if (method === 'query' && params.length > 0 && params[0].startsWith(':set')) {
        const split = params[0].trim().split(' ')

        if (split.length === 3 && split[1].length === 2 && split[2].length === 2) {
            const from = split[1]
            const to = split[2]
            return console.log(
                JSON.stringify({
                    result: [
                        {
                            Title: 'Translate',
                            Subtitle: `Set translate from ${from.toUpperCase()} to ${to.toUpperCase()}`,
                            JsonRPCAction: {
                                method: 'setLanguage',
                                parameters: [from, to],
                            },
                            IcoPath: 'Images\\liber_icon.png',
                        },
                    ],
                })
            )
        } else {
            return console.log(
                JSON.stringify({
                    result: [
                        {
                            Title: 'Translate',
                            Subtitle: '`From` and `To` languages should be words of length 2 `en`,`de` etc.',
                            IcoPath: 'Images\\liber_icon.png',
                        },
                    ],
                })
            )
        }
    } else if (method === 'setLanguage') {
        return fs.writeFileSync(CONFIG_FILE_PATH, params.join(','))
    } else if (method === 'query' && params.length !== 0) {
        let text = params.join(' ').trim()
        const isReverse = text.startsWith('r ')

        if (isReverse && text.length > 2) {
            text = text.substring(2)
            const tmp = from
            from = to
            to = tmp
        }

        if (text) {
            const res = await translate(text, { to })

            return console.log(
                JSON.stringify({
                    result: [
                        {
                            Title: res.text,
                            Subtitle: `${from} -> ${to} parameters`,
                            IcoPath: 'Images\\liber_icon.png',
                        },
                    ],
                })
            )
        } else {
            return console.log(DEFAULT_RESPONSE)
        }
    }
}
