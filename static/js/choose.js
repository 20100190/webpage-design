/**
 * Get choose model data to be sent to the backend.
 */
function getChooseModel() {
    return {"modelName": $("select#model-list").val()};
}
