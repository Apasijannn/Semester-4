using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class Grid
{
    private int width;
    private int height;
    private int[,] gridArray;

    public Grid(int width, int height)
    {
        this.width = width;
        this.height = height;

        gridArray = new int[width, height];
    }


}
