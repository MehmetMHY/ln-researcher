const { Pool, Client } = require('pg')
const { v4: uuidv4 } = require('uuid');

const config = require("../../config/config.json")

async function validTargetType(value){
    return !(typeof(value) !== 'object' || Array.isArray(value) || value === null)
}

async function jsonToAndStatement(targets){
    let reTargets = ""
    let counter = 0
    for ( let key of Object.keys(targets) ) {
        reTargets = reTargets + `data->>'${key}' = '${targets[key]}'`
        if ( counter !== Object.keys(targets).length - 1 ){
            reTargets += " AND "
        }
        counter += 1
    }

    return reTargets
}

async function add(data){
    const output = { "status": 0, "errors": [], "result": [] }
    
    if ( !validTargetType(data) || Object.keys(data).length === 0 ) {
        output["status"] = -1
        output["errors"].push(`Inputed data is NOT a valid object/json: ${JSON.stringify(data)}`)
        return output
    }
    
    try {
        const pool = new Pool(config.postgres.connection)
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
        if ( !validTargetType(targets) || Object.keys(targets).length === 0 ) {
            output["status"] = -1
            output["errors"].push(`Inputed data is NOT a valid object/json: ${JSON.stringify(targets)}`)
            return output
        }
    
        let reTargets = await jsonToAndStatement(targets)
        sqlCmd = `SELECT * FROM images WHERE ${reTargets}`
    }

    try {
        const pool = new Pool(config.postgres.connection)
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

async function remove(targets=undefined){
    const output = { "status": 0, "errors": [], "result": [] }
    
    if ( !validTargetType(targets) || Object.keys(targets).length === 0 ) {
        output["status"] = -1
        output["errors"].push(`Inputed data is NOT a valid object/json: ${JSON.stringify(targets)}`)
        return output
    }

    const reTargets = await jsonToAndStatement(targets)
    const sqlCmd = `DELETE FROM images WHERE ${reTargets}`

    try {
        const pool = new Pool(config.postgres.connection)
        const result = await pool.query(sqlCmd)
        await pool.end()
        output["result"] = result
    } catch(e) {
        output["status"] = -1
        output["errors"].push(`${e}`)
    }

    return output
}

async function edit(key, newValue, targets){
    const output = { "status": 0, "errors": [], "result": [] }
    
    if ( !validTargetType(targets) || Object.keys(targets).length === 0 ) {
        output["status"] = -1
        output["errors"].push(`Inputed data is NOT a valid object/json: ${JSON.stringify(targets)}`)
        return output
    }

    const strKey = String(key)
    const strNewValue = JSON.stringify(newValue)
    const reTargets = await jsonToAndStatement(targets)

    const sqlCmd = `UPDATE images SET data = JSONB_SET(data, '{${strKey}}', '${strNewValue}') WHERE ${reTargets}`

    try {
        const pool = new Pool(config.postgres.connection)
        const result = await pool.query(sqlCmd)
        await pool.end()
        output["result"] = result
    } catch(e) {
        output["status"] = -1
        output["errors"].push(`${e}`)
    }

    return output
}

async function override(targets, newValue){
    const output = { "status": 0, "errors": [], "result": [] }
    
    const reTargets = await jsonToAndStatement(targets)

    const sqlCmd = `UPDATE images SET data = '${JSON.stringify(newValue)}' WHERE ${reTargets}`

    try {
        const pool = new Pool(config.postgres.connection)
        const result = await pool.query(sqlCmd)
        await pool.end()
        output["result"] = result
    } catch(e) {
        output["status"] = -1
        output["errors"].push(`${e}`)
    }

    return output
}

module.exports = {
    get,
    add,
    edit,
    remove,
    validTargetType,
    override
}
