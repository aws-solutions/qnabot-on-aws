// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

window.horde = gremlins.createHorde();
window.horde.gremlin(gremlins.species.clicker())
    .gremlin(gremlins.species.formFiller())
    .gremlin(gremlins.species.typer())

window.start=function(logout=true){
    var logout=document.getElementById('logout')
    if(logout) logout.hidden=logout
    window.horde.unleash()
}

