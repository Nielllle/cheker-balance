 if (retry > 3) {
                isBalancesCollected = true
            }
        }
    }

    try {
        await axios.get('https://www.aptosnames.com/api/mainnet/v1/name/' + wallet).then(response => {
            if (response.data) {
                stats[wallet].aptosname = response.data.name + '.apt'
            }
        })
    } catch (e) {
        if (config.debug) console.log(e.toString())
    }

    await axios.post('https://graphigo.prd.galaxy.eco/query', {
        operationName: 'SpaceAccessQuery',
        variables: {
            alias: 'aptos',
            address: wallet.toLowerCase(),
        },
        query: 'query SpaceAccessQuery($id: Int, $alias: String, $address: String!) {\n  space(id: $id, alias: $alias) {\n    id\n    isFollowing\n    discordGuildID\n    discordGuildInfo\n    status\n    isAdmin(address: $address)\n    unclaimedBackfillLoyaltyPoints(address: $address)\n    addressLoyaltyPoints(address: $address) {\n      id\n      points\n      rank\n      __typename\n    }\n    __typename\n  }\n}\n',
    }, {
        headers: {
            'authority': 'graphigo.prd.galaxy.eco',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://galxe.com',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
    }).then(response => {
        stats[wallet].galxepoints = response.data.data.space ? response.data.data.space.addressLoyaltyPoints.points : null
    }).catch(error => {
        if (config.debug) console.log(error.toString())
    })
}

async function getTxs(wallet, index) {
    const uniqueDays = new Set()
    const uniqueWeeks = new Set()
    const uniqueMonths = new Set()

    let totalGasUsed = 0
    let txs = []
    let isAllTxCollected = false
    let retry = 0
    let page = 0

    while (!isAllTxCollected) {
        try {
            await cloudscraper({
                method: 'GET',
                url: apiUrl + `/account/${wallet}/sendTx?page=${page}&pageSize=25`,
                timeout: 5000,
                headers: reqheaders
            }).then(async response => {
                const data = JSON.parse(response)
                Object.values(data.data).forEach(tx => {
                    txs.push(tx)
                })
                if (data.data.length == 0) {
                    isAllTxCollected = true
                } else {
                    page++
                }
            })
        } catch (e) {
