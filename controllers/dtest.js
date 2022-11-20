const db = require("../middlewares/database/db")

async function apiResetDBEntryTool(id, clearUsed){
    const entries = await db.getImageData({ "id": id })

    const filepath = String(entries[0]["filepath"])

    let before = await db.getImageData({filepath:filepath})

    if (!clearUsed) {
        console.log(JSON.stringify(before, null, indent=4))
    } else {
        console.log("BEFORE:")
        console.log(JSON.stringify(before, null, indent=4))
        console.log("\n\n")
        await db.editImageData(filepath, { usedSignatures: [] }, { filepath: filepath })
        let after = await db.getImageData({filepath:filepath})
        console.log("AFTER:")
        console.log(JSON.stringify(after, null, indent=4))
    }
}

// MAIN FUNCTION CALLS
const id = "f371783c-ac05-4efb-96db-104006933d58"
apiResetDBEntryTool(id, false).then()
