import { createContext, useEffect, useState } from "react"; 
import axios from 'axios';
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';



export const ShopContext = createContext(); 

const ShopContextProvider = (props) => { 
    const currency = '$'; 
    const delivery_fee = 10; 
    // base URL for backend server; VITE_ prefix ensures Vite exposes it
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''
    if(!import.meta.env.VITE_BACKEND_URL){
        // warn during development if variable isn't set
        console.warn('VITE_BACKEND_URL is not defined, falling back to empty string');
    }
    console.log('backendUrl=', backendUrl)

    // helper to build full api endpoint paths
    const api = (path) => `${backendUrl}${path}`
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [products, setProducts] = useState([])
    const [token, setToken] = useState('')
    const navigate = useNavigate();

    const addToCart = async (itemId, size) => {
        if(!size){
            toast.error('Select Product Size');
            return;
        }
        let cartData = structuredClone(cartItems);
        if(cartData[itemId]){
            if(cartData[itemId][size]){
                cartData[itemId][size] += 1;
            }
            else{
                cartData[itemId][size] = 1;
            }
        }
        else{
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData);
        if(token){
            try{
                console.log(token)
                console.log(itemId)
                console.log(size)
                await axios.post(api('/api/cart/add'), {itemId, size}, {headers:{token}})
            }
            catch(error){
                console.log(error);
                toast.error(error.message)
            }
        }
        
    }
       
    const getCartCount = () => {
        let totalCount = 0;
        for(const items in cartItems){
            for(const item in cartItems[items]){
                try{
                    if(cartItems[items][item] > 0){
                        totalCount += cartItems[items][item]
                    }
                }
                catch(error){
                
                }
            }   
        }
        return totalCount;
    }
    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);
        if(token){
            try{
                await axios.post(api('/api/cart/update'), {itemId, size, quantity}, {headers: {token}})
            }
            catch(error){
                console.log(error);
                toast.error(error.message)
            }
        }
    }
    const getCartAmount = () => {
        let totalAmount = 0;
        for(const items in cartItems){
            let itemInfo = products.find((product)=> product._id === items);
            for(const item in cartItems[items]){
                try{
                    if(cartItems[items][item] > 0){
                        totalAmount += itemInfo.price * cartItems[items][item];
                    }
                }
                catch (error){

                }
            }
        }
        return totalAmount;
    }

    const getProductsData = async () => {
        try {
            const response = await axios.get(api('/api/product/list'))
            if(response.data.success){
                setProducts(response.data.products);
            }
            else{
                toast.error(response.data.message)
            }
        }
        catch (error){
            console.log(error)
            toast.error(error.message)
        }
    }

    const getUserCart = async (token) => {
        try{
            const response = await axios.post(api('/api/cart/get'), {}, {headers: {token}})
            if(response.data.success){
                setCartItems(response.data.cartData);
            }
        }
        catch (error){
            console.log(error)
            toast.error(error.message)
        }
    }
    useEffect(()=>{
        getProductsData()
    }, [token])

    useEffect(()=>{
        if(!token && localStorage.getItem('token')){
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
    }, [token])

    const value = { 
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, setCartItems, addToCart, 
        getCartCount, updateQuantity, getCartAmount,
        navigate, backendUrl, api, token, setToken,
        setProducts
    } 
    return ( 
        <ShopContext.Provider value={value}> 
            {props.children}
        </ShopContext.Provider> 
    ) 
} 
export default ShopContextProvider;