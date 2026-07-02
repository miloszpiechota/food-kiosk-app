
const array = [1,2,3,4,4,4,5,6,7]
function removeDuplicates(array){
    const uniqueArray = [];
    for(let i =0; i<array.length;i++){
        if(uniqueArray.indexOf(array[i]) === -1){
            uniqueArray.push(array[i]);
        }
    }
    return uniqueArray;
}
console.log("unique array",removeDuplicates(array));