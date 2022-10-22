const { Pool, Client } = require('pg')
const { v4: uuidv4 } = require('uuid');

const pool = new Pool()

async function isObject(value){
    if ( typeof(value) !== 'object' || Array.isArray(value) || value === null) {
        return false
    }
    return true
}

async function add(data){
    const output = { "status": 0, "errors": [], "result": [] }
    
    if ( !isObject(data) || Object.keys(data).length === 0 ) {
        output["status"] = -1
        output["errors"].push(`Inputed data is NOT a valid object/json: ${JSON.stringify(data)}`)
        return output
    }
    
    try {
        data["id"] = String(uuidv4())
        const result = await pool.query(
            "INSERT INTO images(data) VALUES($1)",
            [JSON.stringify(data)]
        )
        await pool.end()
        output["result"] = result
    } catch(e) {
        output["status"] = -1
        output["errors"].push(`${e}`)
    }

    return output
}

async function get(targets=undefined){
    const output = { "status": 0, "errors": [], "result": [] }
    
    let sqlCmd = "SELECT * FROM images"

    if ( targets !== undefined ) {
        if ( !isObject(targets) || Object.keys(targets).length === 0 ) {
            output["status"] = -1
            output["errors"].push(`Inputed data is NOT a valid object/json: ${JSON.stringify(targets)}`)
            return output
        }
    
        let reTargets = ""
        let counter = 0
        for ( let key of Object.keys(targets) ) {
            reTargets = reTargets + `data->>'${key}' = '${targets[key]}'`
            if ( counter !== Object.keys(targets).length - 1 ){
                reTargets += " AND "
            }
            counter += 1
        }

        sqlCmd = `SELECT * FROM images WHERE ${reTargets}`
    }

    try {
        const data = await pool.query(sqlCmd)
        await pool.end()
        data["rows"].forEach(function (value, index) {
            output["result"].push(value.data)
        })
    } catch(e) {
        output["status"] = -1
        output["errors"].push(`${e}`)
    }

    return output
}

// // MAIN FUNCTION CALLS

// data = { "id": 1, "filepath": "/opt/data/img.png", "status": "labeled", "uploaded": 1666292194, "completed": 1676292194, "labelData": {} }
// add(data).then(result => console.log(JSON.stringify(result, null, indent=4)))
// get( { "id": 1, "filepath": "/opt/data/img.png" } ).then(result=>console.log(result, null, indent=4))


