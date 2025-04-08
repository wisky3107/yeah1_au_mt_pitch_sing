import { _decorator } from 'cc';
import { PopupProcessLoading } from '../PopupProcessLoading';

const { ccclass } = _decorator;

/**
 * Loading popup specifically for the magic tile mode
 */
@ccclass('PopupMagicTileLoading')
export class PopupMagicTileLoading extends PopupProcessLoading {
    // Add any magic tile-specific loading functionality here
} 