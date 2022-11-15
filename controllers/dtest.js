const db = require("../middlewares/database/db")

async function main(){
    const filepath = "/Users/mehmet/Desktop/NEAR-DEV/content/img_data/plants_5-18-2019/corn_plants/img_0012.jpg"

    let before = await db.getImageData({filepath:filepath})
    console.log("BEFORE:")
    console.log(JSON.stringify(before, null, indent=4))

    console.log("\n\n")

    await db.editImageData(filepath, { usedSignatures: [] }, { filepath: filepath })

    let after = await db.getImageData({filepath:filepath})
    console.log("AFTER:")
    console.log(JSON.stringify(after, null, indent=4))
}

main().then()