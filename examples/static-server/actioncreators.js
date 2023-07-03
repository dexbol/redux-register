import {PAGE_ONE_ADD, PAGE_ONE_REMOVE, PAGE_TWO_ADD, PAGE_TWO_REMOVE
    } from './constant.js';

export function pageOneAdd(msg) {
    return {
        type: PAGE_ONE_ADD,
        payload: msg
    };
}

export function pageOneRemove() {
    return {
        type: PAGE_ONE_REMOVE
    };
}

export function pageTwoAdd(msg) {
    return {
        type: PAGE_TWO_ADD,
        payload: msg
    };
}

export function pageTwoRemove() {
    return {
        type: PAGE_TWO_REMOVE
    };
}
