<template>
  <transition name="modal-fade">
    <div class="modal-backdrop">
      <div
        class="modal"
        role="dialog"
        aria-labelledby="modalTitle"
        aria-describedby="modalDescription"
      >
        <header
          id="modalTitle"
          class="modal-header"
        >
          <slot name="header">
            Test All Results
          </slot>
        </header>
        <section
          id="modalDescription"
          class="modal-body"
        >
          <slot name="body">
            <div class="tablebody">
              <table
                aria-label="testAllTable"
                class="modaltable"
              >
                <tr class="modalrow">
                  <th
                    v-for="item in tableHeader"
                    class="modalheader"
                  >
                    {{ item }}
                  </th>
                </tr>
                <tr
                  v-for="item in tableData"
                  :class="getClass(item)"
                >
                  <td
                    v-for="d in item"
                    class="modaldata"
                  >
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
              aria-label="Close modal"
              @click="close"
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

module.exports = {
    name: 'Modal',
    props: {
        tableContent: String,
        tableHeader: Array,
        tableData: Array,
    },
    methods: {
        close() {
            this.$emit('closemodal');
        },
        getClass(value) {
            if (value[0].toLowerCase() === 'no') {
                return 'errorcell';
            }
            return 'modalrow';
        },
    },
};
</script>

<style>

    .modalheader, .modaldata {
        padding: 15px;
        text-align: left;
        font-size: 14px;
    }

    .modalheader {
        background-color: lightblue;
    }

    .modaltable {
        margin: auto;
        background-color: lightgrey;
        table-layout: fixed;
        width: 100%;
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
