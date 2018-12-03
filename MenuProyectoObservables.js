
const inquirer = require('inquirer');
const fs = require('fs');
const rxjs = require('rxjs');
const mergeMap = require('rxjs/operators').mergeMap;
const map = require('rxjs/operators').map;
//const switchMap = require('rxjs/operators').switchMap;

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
    {
        type: 'input',
        name: 'idEquipo',
        message: "Cual es el id del Equipo a ingresar ?"
    },
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
        name: 'costoReparacion',|
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


function inicializarBase() {
    const bddLeida$ = rxjs.from(leerDBB());
    return bddLeida$
        .pipe(
            mergeMap( //Respuesta Anterior Observable
                (respuestaBDD: RespuestaLeerBDD) => {
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
        );
}

function leerDBB() {
    return new Promise(
        (resolve) => {
            fs.readFile('data.json', 'utf-8',
                (error, contenido) => {
                    if (error) {
                        resolve({
                            mensaje: 'Error al abrir la base de datos',
                            bdd: null
                        });
                    } else {
                        resolve({
                            mensaje: 'Base leida correctamente',
                            bdd: JSON.parse(contenido)
                        });
                    }
                }
            );

        }
    );
}

function crearBDD() {
    //= '{"banquetes":[]}';
    const contenido = '{"reparacion":[]}';
    return new Promise(
        (resolve, reject) => {
            fs.writeFile(
                'data.json',
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
            fs.writeFile('data.json',
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
    data?: BaseDeDatos;
    opcionesdelMenu?: OpcionesDelMenu;
    equipo?: Equipo;
    indiceequipo?: number;
}

interface BaseDeDatos {
    banquetes: Equipo[] | any;
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
                                (banquete: Banquete) => {
                                    respuesta.banquete = banquete;
                                    return respuesta;
                                }
                            )
                        );
                case 'Buscar Banquetes':
                    return preguntarNombreBanqueteBuscar(respuesta);
                case 'Actualizar Banquete':
                    return preguntarNombreBanquete(respuesta);
                case 'Eliminar Banquete':
                    return eliminarBanquetePorNombre(respuesta);
                    break;
                case 'Ver Banquetes':

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
                case 'Ingresar nuevo Banquete':
                    respuesta.bdd.banquetes.push(respuesta.banquete);
                    return respuesta;
                    break;
                case 'Buscar Banquetes':
                    const indic = respuesta.indiceBanquete;
                    console.log('respuesta.bdd.banquetes[in]', respuesta.bdd.banquetes[indic]);
                    return respuesta;

                case 'Actualizar Banquete':
                    const indice = respuesta.indiceBanquete;
                    respuesta.bdd.banquetes[indice].costoBanquete = respuesta.banquete.costoBanquete;
                    return respuesta;
                    break;
                case 'Eliminar Banquete':
                    respuesta.bdd.banquetes.splice(respuesta.indiceBanquete,respuesta.indiceBanquete);
                    return respuesta;
                    break;
                case 'Ver Banquetes':
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

function preguntarNombreBanquete(respuesta: RespuestaLeerBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarEquipo))
        .pipe(
            mergeMap(
                (resultado: BuscarBanqueteNombre) => {
                    const indiceBanquete = respuesta.bdd.banquetes
                        .findIndex(
                            (banquete: any) => {
                                return banquete.nombreBanquete === resultado.nombreBanquete;
                            });
                    console.log(respuesta.bdd.banquetes);
                    console.log(indiceBanquete);
                    if (indiceBanquete === -1) {
                        console.log('Lo sentimos ese Banquete no existe, vuelva intentarlo');
                        return preguntarNombreBanquete(respuesta);
                    } else {
                        respuesta.indiceBanquete = indiceBanquete;
                        return rxjs
                            .from(inquirer.prompt(preguntaNuevoCostoEquipo))
                            .pipe(
                                map(
                                    (costoBanquete: { costoBanquete: number }) => {
                                        respuesta.banquete = {
                                            nombreBanquete: null,
                                            costoBanquete: costoBanquete.costoBanquete
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


function preguntarNombreBanqueteBuscar(respuesta: RespuestaLeerBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaBuscarEquipo))
        .pipe(
            mergeMap(
                (resultado: BuscarBanqueteNombre) => {
                    const indiceBanquete = respuesta.bdd.banquetes
                        .findIndex(
                            (banquete: any) => {
                                return banquete.nombreBanquete === resultado.nombreBanquete;
                            });
                    //console.log(respuesta.bdd.banquetes);
                    console.log(indiceBanquete);
                    if (indiceBanquete === -1) {
                        console.log('Lo sentimos ese Banquete no existe, vuelva intentarlo');
                        //preguntarNombreBanqueteBuscar(respuesta);
                    } else {
                        respuesta.indiceBanquete = indiceBanquete;
                        return rxjs.of(respuesta);
                    }
                }
            )
        );
}


function eliminarBanquetePorNombre(respuesta: RespuestaLeerBDD) {
    return rxjs
        .from(inquirer.prompt(preguntaEliminarEquipo))
        .pipe(
            mergeMap(
                (resultado: BuscarBanqueteNombre) => {
                    const indiceBanquete = respuesta.bdd.banquetes
                        .findIndex(
                            (banquete: any) => {
                                return banquete.nombreBanquete === resultado.nombreBanquete;
                            });
                    console.log(indiceBanquete);
                    if (indiceBanquete === -1) {
                        console.log('Lo sentimos ese Banquete no existe, vuelva intentarlo');
                        return preguntarNombreBanquete(respuesta);
                    } else {
                        console.log("El banquete fue eliminado correctamente");
                        respuesta.indiceBanquete = indiceBanquete;
                        return rxjs.of(respuesta);
                    }
                }
            )
        );
}

main();