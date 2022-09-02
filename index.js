const fs = require('fs')
const axios = require('axios')

const CONFIG_FILE_PATH = `${process.env.plugin_dir}/language_config`
const DEFAULT_RESPONSE = JSON.stringify({
    result: [
        {
            Title: 'Translate',
            Subtitle: 'type text to translate or set `from`->`to` languages: `_set en de`',
            IcoPath: 'Images\\liber_icon.png',
        },
    ],
})

let { method, parameters: params } = JSON.parse(process.argv[2])

if (!fs.existsSync(CONFIG_FILE_PATH)) {
    fs.writeFileSync(CONFIG_FILE_PATH, `en,de`)
}
const [from, to] = fs.readFileSync(CONFIG_FILE_PATH).toString('utf8').trim().split(',')

Promise.resolve().then(async () => {
    if (method === 'query' && (params.length === 0 || (params.length === 1 && !params[0]))) {
        console.log(DEFAULT_RESPONSE)
    } else if (method === 'query' && params.length > 0 && params[0].startsWith('_set')) {
        const split = params[0].trim().split(' ')

        if (split.length === 3 && split[1].length === 2 && split[2].length === 2) {
            const from = split[1]
            const to = split[2]
            console.log(
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
            console.log(
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
        fs.writeFileSync(CONFIG_FILE_PATH, params.join(','))
    } else if (method === 'query' && params.length !== 0) {
        const text = params.join(' ').trim()

        if (text) {
            const res = await makeRequest(params.join(' '), from, to)

            console.log(
                JSON.stringify({
                    result: [
                        {
                            Title: res,
                            Subtitle: `${from} -> ${to} parameters`,
                            IcoPath: 'Images\\liber_icon.png',
                        },
                    ],
                })
            )
        } else {
            console.log(DEFAULT_RESPONSE)
        }
    }
})

async function makeRequest(text, from = 'auto', to) {
    try {
        const res = await axios.post(
            'https://libretranslate.de/translate',
            {
                q: text,
                source: from,
                target: to,
                format: 'text',
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        )

        return res.data.translatedText
    } catch (e) {
        return e?.response?.data?.error || e?.message || e?.response?.statusText || e?.code || 'Request Error'
    }
}
