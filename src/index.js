import fs from 'fs'
import translate from '@vitalets/google-translate-api'
import clipboard from 'clipboardy'
import { getFromTo, response } from './utils.js'
import { CONFIG_FILE_PATH, DEFAULT_RESULT, ICON_PATH } from './constants.js'

Promise.resolve().then(async () => {
    try {
        let { method, parameters: params } = JSON.parse(process.argv[2])
        let { from, to } = getFromTo()

        await main(method, params, from, to)
    } catch (e) {
        response([
            {
                Title: 'Error',
                Subtitle: e.message || '',
                IcoPath: ICON_PATH,
            },
        ])
    }
})

async function main(method, params, from, to) {
    if (method === 'query' && (params.length === 0 || (params.length === 1 && !params[0]))) {
        return response(DEFAULT_RESULT)
    } else if (method === 'query' && params.length > 0 && params[0].startsWith(':set')) {
        const split = params[0].trim().split(' ')

        if (split.length === 3) {
            const from = split[1]
            const to = split[2]
            return response([
                {
                    Title: 'Translate',
                    Subtitle: `Set translate from ${from.toUpperCase()} to ${to.toUpperCase()}`,
                    JsonRPCAction: {
                        method: 'setLanguage',
                        parameters: [from, to],
                    },
                    IcoPath: ICON_PATH,
                },
            ])
        } else {
            return response([
                {
                    Title: 'Translate',
                    Subtitle: '`From` and `To` languages should be words of length 2 `en`,`de` etc.',
                    IcoPath: ICON_PATH,
                },
            ])
        }
    } else if (method === 'setLanguage') {
        return fs.writeFileSync(CONFIG_FILE_PATH, params.join(','))
    } else if (method === 'copy') {
        return clipboard.writeSync(params.join())
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
            const res = await translate(text.trim(), { to })

            return response([
                {
                    Title: res.text,
                    Subtitle: `${from} -> ${to} parameters`,
                    IcoPath: ICON_PATH,
                    JsonRPCAction: {
                        method: 'copy',
                        parameters: [res.text],
                        dontHideAfterAction: false,
                    },
                },
            ])
        } else {
            return response(DEFAULT_RESULT)
        }
    }
}
