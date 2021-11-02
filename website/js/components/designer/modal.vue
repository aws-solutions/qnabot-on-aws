<template>
    <transition name="modal-fade">
        <div class="modal-backdrop">
            <div class="modal"
                 role="dialog"
                 aria-labelledby="modalTitle"
                 aria-describedby="modalDescription"
            >
                <header
                        class="modal-header"
                        id="modalTitle"
                >
                    <slot name="header">
                        Test All Results
                    </slot>
                </header>
                <section
                        class="modal-body"
                        id="modalDescription"
                >
                    <slot name="body">
                        <div class="tablebody">
                            <table class="modaltable">
                                <tr class="modalrow">
                                    <th class="modalheader" v-for="item in tableHeader">{{ item }}</th>
                                </tr>
                                <tr v-for="item in tableData" v-bind:class="getClass(item)">
                                    <td class="modaldata" v-for="d in item">
                                        {{ d }}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </slot>
                </section>
                <footer class="modal-footer">
                    <slot name="footer">
                        <button
                                type="button"
                                class="btn-green"
                                @click="close"
                                aria-label="Close modal"
                        >
                            Close
                        </button>
                    </slot>
                </footer>
            </div>
        </div>
    </transition>
</template>

<script>
    /*
    Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
    SPDX-License-Identifier: Apache-2.0    

    VUE template to present test all results in a modal view
    */

    import { EventBus } from './event-bus.js';
    export default {
        name: 'modal',
        props: {
            tableContent: String,
            tableHeader: Array,
            tableData: Array,
        },
        methods: {
            close() {
                EventBus.$emit('closemodal');
            },
            getClass(value){
                if (value[0].toLowerCase() === 'no'){
                    return 'errorcell';
                } else {
                    return 'modalrow';
                }
            }
        },
    };
</script>

<style>

    .modalheader, .modaldata {
        padding: 15px;
        text-align: left;
    }

    .modalheader {
        background-color: lightblue;
    }

    .modaltable {
        align: center;
        margin: auto;
        background-color: lightgrey;
    }

    .modalrow {
        background-color: lightgrey;
        vertical-align: top;
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: +1;
    }

    .modal {
        background: #FFFFFF;
        box-shadow: 2px 2px 20px 1px;
        overflow-x: auto;
        display: flex;
        flex-direction: column;
    }

    .modal-header,
    .modal-footer {
        padding: 15px;
        display: flex;
    }

    .modal-header {
        border-bottom: 1px solid #eeeeee;
        color: #4AAE9B;
        justify-content: space-between;
    }

    .modal-footer {
        border-top: 1px solid #eeeeee;
        justify-content: flex-end;
    }

    .modal-body {
        position: relative;
        padding: 20px 10px;
    }

    .btn-green {
        color: white;
        background: #4AAE9B;
        border: 1px solid #4AAE9B;
        border-radius: 2px;
    }

    .tablebody {
        height: 50vh;
        width: 75vw;
        overflow: auto
    }
    .errorcell {
        background-color: lightcoral;
        vertical-align: top;
    }

</style>