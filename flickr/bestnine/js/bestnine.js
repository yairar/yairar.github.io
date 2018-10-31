
function AddTableOfPhotos(photosArr){
	console.log('AddTableOfPhotos');

	var table = $('<table></table>').addClass('bestninetable');
	for(i=0; i<3; i++){
	    var row = $('<tr></tr>');
	    for(j=0; j<3; j++){
	    	var cell = $('<td><div style="background: url('+ photosArr[i*3+j].getUrl('m') + ') 50% 50% no-repeat;"></div></td>');
	    	row.append(cell);
	    }
	    table.append(row);
	}

	$('#bestninediv').append(table);
}

function RemoveTableOfPhotos(){
	console.log('RemoveTableOfPhotos');

	$('.bestninetable').remove();
}