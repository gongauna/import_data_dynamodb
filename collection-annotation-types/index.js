// Imports
const refreshAnnotationTypesInformation = require("./refresh-annotation-types-department.js");
const backfillAnnotationsDepartment = require("./backfill-annotations-department.js");

const ambiente = "";
/*refreshAnnotationTypesInformation.refreshAnnotationTypesInformation(ambiente).then((res, error) => {
    console.log("finish annotations types promise")
});*/
backfillAnnotationsDepartment.backfillAnnotationsDepartment(ambiente);

