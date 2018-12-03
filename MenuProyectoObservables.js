
const inquirer = require('inquirer');
const fs = require('fs');
const rxjs = require('rxjs');
const mergeMap = require('rxjs/operators').mergeMap;
const map = require('rxjs/operators').map;
const switchMap = require('rxjs/operators').switchMap;

const menuPrincipal =
    {
        type: 'list',
        name: 'opcionesdelMenu',
        message: 'Seleciona una opcion',
        choices: [
            'Ver Equipo',
            'Ingresar nuevo Equipo',
            'Buscar Equipo',
            'Actualizar Equipo',
            'Eliminar Equipo',
        ]
    };

const preguntaIngresoEquipo = [
  /*  {
        type: 'input',
        name: 'idEquipo',
        message: "Cual es el id del Equipo a ingresar ?"
    },*/
    {
        type: 'input',
        name: 'nombreEquipo',
        message: "Cual es el nombre del Equipo a ingresar ?"
    },
    {
        type: 'input',
        name: 'costoReparacion',
        message: "Ingrese el costo de reparación?"
    }
];

const preguntaBuscarEquipo = [
    {
        name: 'nombreEquipo',
        type: 'input',
        message: "Cual es el id del Equipo que desea buscar?"
    }
];

const preguntaEliminarEquipo = [
    {
        name: 'nombreEquipo',
        type: 'input',
        message: "Cual es el id del Equipo que desea eliminar?"
    }
];

const preguntaNuevoCostoEquipo = [
    {
        name: 'costoReparacion',
        type: 'input',
        message: "Cual es el id del Equipo a que desea actualizar?"
    }
];


function main() {
    console.log('Empezo');
    inicializarBase()
        .pipe(
            preguntarOpcionesMenu(),
            preguntarDatos(),
            ejecutarAccion(),
            actualizarBDD()
        )
        .subscribe(
            (respuesta) => {
                console.log(respuesta);
            },
            (error) => {
                console.log('Error');
            },
            () => {
                console.log('Completado');
                main();
            }
        )
}

/*
function inicializarBase() {
    const bddLeida$ = rxjs.from(leerDBB());
    return bddLeida$
        .pipe(
            mergeMap( //Respuesta Anterior Observable
                (respuestaBDD:RespuestaLeerBDD) => {
                    if (respuestaBDD.bdd) {
                        return rxjs
                            .of(respuestaBDD);
                    } else {
                        //crear la base
                        return rxjs
                            .from(crearBDD());

                    }
                }
            ),
        ),
};
*/

function inicializarBase() {

    const bddLeida$ = rxjs.from(leerBDD());

    return bddLeida$
        .pipe(
            mergeMap(  // Respuesta anterior Observable
                (respuestaBDD: RespuestaLeerBDD) => {
                    if (respuestaBDD.bdd) {
                        return rxjs
                            .of(respuestaBDD);
                    } else {
                        // crear la base

                        return rxjs
                            .from(crearBDD());
                    }

                }
            ),
        );
}
function leerBDD() {
    return new Promise(
        (resolve) => {
            fs.readFile(
                'bdd.json',
                'utf-8',
                (error, contenidoArchivo) => {
                    if (error) {
                        resolve({
                            mensaje: 'No existe la Base de Datos',
                            bdd: null
                        });
                    } else {
                        resolve({
                            mensaje: 'Base de datos leida',
                            bdd: JSON.parse(contenidoArchivo)
                        });
                    }
                }
            );
        }
    );
}


function crearBDD() {

    const contenido = '{"reparacion":[]}';
    return new Promise(
        (resolve, reject) => {
            fs.writeFile(
                'bdd.json',
                contenido,
                (error) => {
                    if (error) {
                        reject({
                            mensaje: 'Error creando la Base de Datos',
                            error: 500
                        });
                    } else {
                        resolve({
                            mensaje: 'Base de Datos creada exitosamente',
                            bdd: JSON.parse(contenido)
                        });
                    }
                }
            );
        }
    );
}

function guardarBDD(bdd: BaseDeDatos) {
    return new Promise(
        (resolve, reject) => {
            fs.writeFile('bdd.json',
                JSON.stringify(bdd),
                (error) => {
                    if (error) {
                        reject({
                            mensaje: 'Error guardando la Base de Datos',
                            error: 500
                        });
                    } else {
                        resolve({
                            mensaje: 'Base de Datos guardada exitosamente',
                            bdd
                        });

                    }
                }
            );
        }
    );
}

function preguntarOpcionesMenu() {
    return mergeMap(
        (respuesta: RespuestaLeerBDD) => {
            return rxjs
                .from(inquirer.prompt(menuPrincipal))
                .pipe(
                    map(
                        (opcionMenu: OpcionesDelMenu) => {
                            respuesta.opcionesdelMenu = opcionMenu;
                            return respuesta;
                        }
                    )
                )
        }
    );
}


interface RespuestaLeerBDD {
    mensaje: string;
    bdd?: BaseDeDatos;
    opcionesdelMenu?: OpcionesDelMenu;
    equipo?: Equipo;
 //   indiceequipo?: number;
}

interface BaseDeDatos {
    reparacion: Equipo[] | any;
}

interface Equipo{
    nombreEquipo: string,
        costoReparacion: number
}

interface BuscarEquipoNombre {
    nombreEquipo: string,
}

interface OpcionesDelMenu {
    opcionesdelMenu: 'Ver Equipo' | 'Ingresar nuevo Equipo' | 'Buscar Equipo' | 'Actualizar Equipo' | 'Eliminar Equipo'
}


function preguntarDatos() {
    return mergeMap(
        (respuesta: RespuestaLeerBDD) => {
            switch (respuesta.opcionesdelMenu.opcionesdelMenu) {
                case 'Ingresar nuevo Equipo':
                    return rxjs
                        .from(inquirer.prompt(preguntaIngresoEquipo))
                        .pipe(
                            map(
                                (equipo: Equipo) => {
                                    respuesta.equipo = equipo;
                                    return respuesta;
                                }
                            )
                        );
                case 'Buscar Equipo':
                    return preguntarNombreEquipoBuscar(respuesta);
                case 'Actualizar Equipo':
                    return preguntarNombreEquipo(respuesta);
                case 'Eliminar Equipo':
                    return eliminarEquipoPorNombre(respuesta);
                    break;
                case 'Ver Equipo':

                    break;
            }
        }
    );
}


function ejecutarAccion() {
    return map(
        (respuesta: RespuestaLeerBDD) => {
            const opcion = respuesta.opcionesdelMenu.opcionesdelMenu;
            switch (opcion) {
                case 'Ingresar nuevo Equipoe':
                    respuesta.bdd.reparacion.push(respuesta.equipo);
                    return respuesta;
                    break;
                case 'Buscar Equipo':
                    const indic = respuesta.indiceEquipo;
                    console.log('respuesta.bdd.reparacion[in]', respuesta.bdd.reparacion[indic]);
                    return respuesta;

                case 'Actualizar Equipo':
                    const indice = respuesta.indiceEquipo;
                    respuesta.bdd.reparacion[indice].costoReparacion = respuesta.reparacion.costoReparacion;
                    return respuesta;
                    break;
                case 'Eliminar Equipo':
                    respuesta.bdd.reparacion.splice(respuesta.indiceEquipo,respuesta.indiceEquipo);
                    return respuesta;
                    break;
                case 'Ver Equipo':
                    break;
            }
        }
    )
}


function actualizarBDD() {
    return mergeMap(
        (respuesta: RespuestaLeerBDD) => {
            return rxjs.from(guardarBDD(respuesta.bdd));
        }
    )
}

function preguntarNombreEquipo(respuesta: RespuestaLeerBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarEquipo))
        .pipe(
            mergeMap(
                (resultado: BuscarEquipoNombre) => {
                    const indiceEquipo = respuesta.bdd.reparacion
                        .findIndex(
                            (equipo: any) => {
                                return equipo.nombreEquipo === resultado.nombreEquipo;
                            });
                    console.log(respuesta.bdd.reparacion);
                    console.log(indiceEquipo);
                    if (indiceEquipo === -1) {
                        console.log('Lo sentimos ese Equipo no existe, vuelva intentarlo');
                        return preguntarNombreEquipo(respuesta);
                    } else {
                        respuesta.indiceEquipo = indiceEquipo;
                        return rxjs
                            .from(inquirer.prompt(preguntaNuevoCostoEquipo))
                            .pipe(
                                map(
                                    (costoReparacion: { costoReparacion: number }) => {
                                        respuesta.equipo = {
                                            nombreEquipo: null,
                                            costoReparacion: costoReparacion.costoReparacion
                                        };
                                        return respuesta;
                                    }
                                )
                            )
                    }
                }
            )
        );
}


function preguntarNombreEquipoBuscar(respuesta: RespuestaLeerBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarEquipo))
        .pipe(
            mergeMap(
                (resultado: BuscarEquipoNombre) => {
                    const indiceEquipo = respuesta.bdd.reparacion
                        .findIndex(
                            (equipo: any) => {
                                return equipo.nombreEquipo === resultado.nombreEquipo;
                            });

                    console.log(indiceEquipo);
                    if (indiceEquipo === -1) {
                        console.log('Lo sentimos ese Equipo no existe, vuelva intentarlo');

                    } else {
                        respuesta.indiceEquipo = indiceEquipo;
                        return rxjs.of(respuesta);
                    }
                }
            )
        );
}


function eliminarEquipoPorNombre(respuesta: RespuestaLeerBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaEliminarEquipo))
        .pipe(
            mergeMap(
                (resultado: BuscarEquipoNombre) => {
                    const indiceEquipo = respuesta.bdd.reparacion
                        .findIndex(
                            (equipo: any) => {
                                return equipo.nombreEquipo === resultado.nombreEquipo;
                            });
                    console.log(indiceEquipo);
                    if (indiceEquipo === -1) {
                        console.log('Lo sentimos ese Equipo no existe, vuelva intentarlo');
                        return preguntarNombreEquipo(respuesta);
                    } else {
                        console.log("El Equipo fue eliminado correctamente");
                        respuesta.indiceEquipo = indiceEquipo;
                        return rxjs.of(respuesta);
                    }
                }
            )
        );
}

main();